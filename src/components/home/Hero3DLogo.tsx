import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Bounds, Center, Environment, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import logoUrl from "../../assets/MSSHIN_logo_metallic.glb?url";

useGLTF.preload(logoUrl);

/** 정면을 살짝 위에서 내려다보듯 기울여, 두께(8 unit)가 있는 얇은 부조라는 게
 *  드러나도록 하는 기본 틸트각. */
const BASE_TILT_X = -0.16;
/** 한 바퀴씩 계속 도는 대신, 입체감이 딱 드러나 보이는 정도로 고정해두는
 *  3/4 각도. */
const BASE_ROTATION_Y = 0.32;

/** 이 시간(초, Canvas 마운트 시점 기준)이 지나기 전까지는 유휴 스웨이/마우스
 *  추적 기울임을 아예 적용하지 않고 기준각(BASE_ROTATION_Y/BASE_TILT_X)에
 *  가만히 멈춰 있는다 — Hero.tsx의 로고 진입(스케일업) 애니메이션이 대략 이
 *  시점에 끝나므로, "정중앙에 딱 나타난 뒤에야 비로소 움직이기 시작"하는
 *  것처럼 보이게 한다. 진입 애니메이션과 동시에 이미 흔들리고 있으면 처음
 *  자리를 잡기도 전에 산만하게 보인다. */
const ENTRANCE_HOLD_SEC = 2;

/** 정점 애니메이션 대상이 되는 메시 하나의 상태 — 지오메트리 로드 직후의 원본
 *  좌표 스냅샷(original)과, 매 프레임 댐핑되며 0으로 수렴하는 정점별 Z 오프셋
 *  버퍼(offsets)를 함께 들고 있는다. */
interface WaveMeshEntry {
  mesh: THREE.Mesh;
  original: Float32Array;
  offsets: Float32Array;
  boundingRadius: number;
}

/** 마우스가 메시를 스칠 때마다 하나씩 생성되는, 그 지점에서 바깥으로 퍼져나가는
 *  링 형태의 웨이브 이벤트. */
interface RippleEvent {
  worldPoint: THREE.Vector3;
  startTime: number;
  amplitude: number;
}

/** 리플이 퍼져나가는 속도/폭/감쇠, 정점 오프셋이 목표값으로 수렴하는 속도 등을
 *  전부 모델의 실제 바운딩 반지름에 비례해서 정하므로, GLB가 다른 스케일로
 *  다시 내보내져도 그대로 자연스럽게 맞아 들어간다. */
const RIPPLE_SPEED_FACTOR = 1.5; // 반지름의 몇 배 만큼을 1초에 퍼져나가는지
// 링 폭을 넓게 잡을수록 이웃 정점 사이 변위 기울기가 완만해져, 날카로운 파문
// 대신 깃발처럼 부드럽게 굽이치는 느낌이 난다.
const RIPPLE_BAND_FACTOR = 0.55; // 웨이브 링 자체의 폭
const RIPPLE_CUTOFF_FACTOR = 1.6; // 이 거리(반지름의 배수)를 넘는 정점은 아예 계산 생략
const RIPPLE_AMPLITUDE_FACTOR = 0.24; // 최대로 밀려나는 깊이(반지름 대비)
const RIPPLE_DECAY_PER_SEC = 1.6; // 리플 전체 세기가 시간에 따라 옅어지는 속도
const RIPPLE_MAX_AGE_SEC = 2.4; // 이보다 오래된 리플은 배열에서 제거
const RIPPLE_SPAWN_INTERVAL_MS = 70; // 너무 촘촘하게 생성되지 않도록 하는 스로틀
const MAX_RIPPLES = 3;
// 정점별 현재 오프셋이 매 프레임 "목표 오프셋(리플 합산값)"으로 얼마나 빨리
// 댐핑되는지 — 값이 작을수록 더 굼뜨고 물렁하게, 통통 튀지 않고 가라앉는다.
const OFFSET_DAMP_LAMBDA = 5;
// 마우스 이동 속도(초당 로컬 유닛)를 진폭 배율로 바꿀 때 기준이 되는 정규화 값 —
// 이 속도로 움직이면 배율이 대략 1이 된다. boundingRadius에 비례해서 매 모델마다
// 다시 계산한다.
const SPEED_NORMALIZER_FACTOR = 4.5;

function LogoModel({ visibleRef }: { visibleRef: RefObject<boolean> }) {
  const { scene } = useGLTF(logoUrl);
  // Canvas가 frameloop="demand"라 아무것도 안 바뀌면 렌더 자체가 안 도는데,
  // 스핀/틸트가 목표각으로 보간되는 동안과 웨이브가 진행되는 동안엔 매
  // 프레임 다시 그려야 하므로 그때그때 invalidate()로 다음 프레임을 명시적
  // 으로 요청한다.
  const invalidate = useThree((state) => state.invalidate);
  const spinRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const waveMeshesRef = useRef<WaveMeshEntry[]>([]);
  const ripplesRef = useRef<RippleEvent[]>([]);
  const lastSpawnAtRef = useRef(0);
  const lastMoveRef = useRef<{ point: THREE.Vector3; time: number } | null>(null);
  // 마우스가 로고 근처에 온 적이 아예 없어서 리플도 없고 정점 오프셋도 전부
  // 0으로 가라앉은 "완전 정지" 상태인지 추적한다 — 이 상태에선 정점 10만개
  // 이상을 매 프레임 순회하던 비용 자체를 아예 건너뛴다. 히어로가 화면에
  // 떠 있는 시간 대부분이 이 상태이므로, 여기서 아끼는 비용이 체감 렉을
  // 가장 크게 좌우한다.
  const settledRef = useRef(true);

  useEffect(() => {
    // (예전 로고와 달리) 이 GLB는 그 자체로 베이스컬러/노멀/메탈릭러프니스
    // 맵이 입혀진 재질을 갖고 있다. 그 텍스처는 그대로 살리되, 웨이브
    // 인터랙션과 궁합이 맞는 속성(clearcoat)만 우리 쪽에서 얹은 새 재질로
    // 감싼다 — GLTFLoader가 만들어준 원본 재질 인스턴스를 직접 고치면 drei
    // 캐시에 저장된 원본까지 오염되므로, 항상 새로 만든다.
    const entries: WaveMeshEntry[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        // useGLTF는 같은 URL이면 scene(과 그 안의 geometry)을 drei 캐시에서
        // 재사용한다 — 원본 지오메트리를 그대로 매 프레임 mutate하면 이
        // 컴포넌트가 언마운트/재마운트되거나(HMR, StrictMode 이중 실행 등)
        // 캐시가 다른 곳에서도 쓰일 때 원본이 오염될 수 있다. 이 인스턴스
        // 전용 geometry로 clone해서 그 사본만 건드린다.
        mesh.geometry = mesh.geometry.clone();

        const original = mesh.material as THREE.MeshStandardMaterial | undefined;
        const material = new THREE.MeshPhysicalMaterial({
          map: original?.map ?? null,
          normalMap: original?.normalMap ?? null,
          metalnessMap: original?.metalnessMap ?? null,
          roughnessMap: original?.roughnessMap ?? null,
          // 베이스컬러 맵이 있으면 순백(곱해도 색이 안 바뀜)으로 둬서 원본
          // 색을 틴트 없이 그대로 보여준다.
          color: original?.map ? 0xffffff : 0xc9c9c9,
          metalness: 1,
          // roughnessMap이 있으면 스칼라를 1(항등)로 둬서 맵이 구워둔 부위별
          // 거칠기 변화를 그대로 존중한다 — 고정값으로 덮으면 전체가
          // 균일하게 반들거려 원본의 질감 편차가 사라진다.
          roughness: original?.roughnessMap ? 1 : 0.16,
          clearcoat: 0.5,
          clearcoatRoughness: 0.25,
          // 완전한 금속(metalness:1)이라 직접광보다 환경맵 반사가 밝기를
          // 좌우한다 — 직접광만 낮춰서는 거의 안 어두워지길래 이 값으로
          // 밝기를 조절한다.
          envMapIntensity: 0.75,
          // 평소(정점 오프셋이 전부 0인 상태)엔 매끈한 스무스 셰이딩으로 원본
          // 곡면 그대로 보여준다. 웨이브가 지나가는 동안만 useFrame에서
          // computeVertexNormals()를 다시 호출해 변형된 표면에 맞는 노멀로
          // 갱신하고, 웨이브가 가라앉으면 다시 호출을 멈춘다 — 그러면 굳이
          // flatShading으로 폴리곤 면을 드러내지 않아도 된다.
          flatShading: false,
        });
        mesh.material = material;

        // 웨이브 인터랙션을 위해 원본 좌표를 스냅샷 떠 두고, 정점별 오프셋
        // 버퍼(처음엔 전부 0)를 함께 준비한다.
        mesh.geometry.computeBoundingSphere();
        const position = mesh.geometry.attributes.position as THREE.BufferAttribute;
        // 기본값(StaticDrawUsage)은 "자주 안 바뀐다"는 힌트라 드라이버가 그렇게
        // 최적화해두는데, 이 버퍼는 매 프레임 새로 쓴다 — DynamicDrawUsage로
        // 바꿔야 (특히 소프트웨어 렌더러에서) 매 프레임 갱신이 깨지지 않고
        // 제대로 반영된다.
        position.setUsage(THREE.DynamicDrawUsage);
        // 웨이브가 활성화된 동안엔 노멀도 매 프레임 다시 써야 하므로 동일하게
        // DynamicDrawUsage로 바꿔둔다.
        const normalAttr = mesh.geometry.attributes.normal as THREE.BufferAttribute | undefined;
        normalAttr?.setUsage(THREE.DynamicDrawUsage);
        entries.push({
          mesh,
          original: Float32Array.from(position.array as Float32Array),
          offsets: new Float32Array(position.count),
          boundingRadius: mesh.geometry.boundingSphere?.radius ?? 1,
        });
      }
    });
    waveMeshesRef.current = entries;
    ripplesRef.current = [];
    settledRef.current = true;
  }, [scene]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      // 목표각이 바뀌었으니 스핀/틸트가 그쪽으로 보간되도록 프레임을 하나
      // 요청한다 — useFrame 안에서 아직 목표에 덜 도달했으면 스스로 다음
      // 프레임도 계속 요청해 부드러운 보간이 이어진다. 히어로가 스크롤로
      // 화면 밖에 있는 동안은 요청 자체를 하지 않는다.
      if (visibleRef.current) invalidate();
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [invalidate]);

  useFrame((state, rawDelta) => {
    const spin = spinRef.current;
    const tilt = tiltRef.current;
    if (!spin || !tilt) return;
    // 히어로가 스크롤로 화면 밖에 나가 있는 동안엔 유휴 모션 계산과 그로
    // 인한 매 프레임 invalidate() 재요청 자체를 멈춘다 — frameloop="demand"
    // 라도 이 유휴 모션이 스스로 끊임없이 다음 프레임을 요청해서 사실상
    // 항상 60fps로 그려지고 있었고, 스크롤로 안 보이는 동안까지 그 비용을
    // 계속 지불하는 게 체감 렉의 큰 원인이었다.
    if (!visibleRef.current) return;

    // 탭이 백그라운드에 있다 돌아오는 등 프레임 간격이 비정상적으로 커지는
    // 경우, damp 계산이 한 프레임 만에 목표값으로 순간이동해버리는 걸 막는다.
    const delta = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;

    // 마우스가 전혀 안 움직여도 "이건 평면 이미지가 아니라 3D 오브젝트다"라는
    // 게 드러나도록, 서로 주기가 다른 사인파 몇 개를 얹어 아주 은은하게
    // 계속 떠 있는 듯한 유휴 모션을 더한다 — 주기를 다르게 둬야 흔들림이
    // 기계적으로 반복되는 티가 안 나고 자연스럽게 표류하는 느낌이 난다.
    // 진입 애니메이션이 자리 잡기 전(ENTRANCE_HOLD_SEC 이전)엔 이 모션과
    // 마우스 추적을 전부 0으로 죽여서, 기준각에 가만히 멈춰 있다가 자리를
    // 완전히 잡은 뒤에야 움직이기 시작하게 한다.
    const settled = t > ENTRANCE_HOLD_SEC;
    const idleSwayY = settled ? Math.sin(t * 0.45) * 0.075 : 0;
    const idleTiltX = settled ? Math.sin(t * 0.65 + 1.3) * 0.045 : 0;
    const idleBobY = settled ? Math.sin(t * 0.6 + 0.6) * 0.11 : 0;
    const pointerX = settled ? pointer.current.x : 0;
    const pointerY = settled ? pointer.current.y : 0;

    // 한 바퀴씩 계속 도는 대신 고정된 3/4 각도를 기준으로, 마우스 위치에 따라
    // 아주 살짝만 좌우/상하로 기울여 입체감만 은은하게 느껴지게 한다.
    const targetSpinY = BASE_ROTATION_Y + pointerX * 0.12 + idleSwayY;
    const targetTiltX = BASE_TILT_X + pointerY * 0.12 + idleTiltX;
    const targetTiltZ = -pointerX * 0.08;
    spin.rotation.y = THREE.MathUtils.lerp(spin.rotation.y, targetSpinY, 0.04);
    tilt.rotation.x = THREE.MathUtils.lerp(tilt.rotation.x, targetTiltX, 0.04);
    tilt.rotation.z = THREE.MathUtils.lerp(tilt.rotation.z, targetTiltZ, 0.04);
    spin.position.y = THREE.MathUtils.lerp(spin.position.y, idleBobY, 0.04);

    // 유휴 모션 자체가 매 프레임 계속 값이 바뀌는 애니메이션이라(마우스가
    // 멈춰도 절대 "수렴"하지 않는다), frameloop="demand"에서도 매 프레임
    // 다음 프레임을 계속 요청해야 한다.
    invalidate();

    // 리플도 없고 지난 프레임에 이미 다 가라앉은 걸 확인했다면, 정점 10만개
    // 이상을 순회하는 아래 블록 전체를 건너뛴다 — 히어로가 화면에 있는
    // 시간 대부분이 이 상태라 렉 체감에 가장 큰 영향을 준다.
    if (settledRef.current) return;

    // ---- 깃발 웨이브 인터랙션: 활성 리플들을 정점에 반영 ----
    // pointermove 핸들러(useFrame 밖)에서 리플을 생성할 때도 같은 시계를 써야
    // 하므로 R3F의 state.clock 대신 performance.now()로 통일한다.
    const now = performance.now() / 1000;
    const ripples = ripplesRef.current;
    if (ripples.length > 0) {
      // 수명이 다한 리플 제거
      ripplesRef.current = ripples.filter((r) => now - r.startTime < RIPPLE_MAX_AGE_SEC);
    }
    const activeRipples = ripplesRef.current;

    // 이번 프레임을 지나고도 리플이 하나도 안 남았고 모든 메시가 가라앉아
    // 있으면, 다음 프레임부턴 위의 이른 리턴으로 이 블록 자체를 건너뛴다.
    let anyEntryActive = false;

    for (const entry of waveMeshesRef.current) {
      const { mesh, original, offsets, boundingRadius } = entry;
      const position = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const array = position.array as Float32Array;

      const rippleSpeed = boundingRadius * RIPPLE_SPEED_FACTOR;
      const bandWidth = boundingRadius * RIPPLE_BAND_FACTOR;
      const cutoff = boundingRadius * RIPPLE_CUTOFF_FACTOR;
      const cutoffSq = cutoff * cutoff;

      // 리플의 월드 좌표를 이 메시의 로컬 좌표계로 한 번씩만 변환해둔다(정점마다
      // 반복하면 낭비).
      const localRipples = activeRipples.map((r) => ({
        local: mesh.worldToLocal(r.worldPoint.clone()),
        age: now - r.startTime,
        amplitude: r.amplitude * Math.exp(-(now - r.startTime) * RIPPLE_DECAY_PER_SEC),
      }));

      // 이번 프레임에 정점이 실제로(무시할 만한 수준 이상) 밀려나 있는지를
      // 추적해서, 그럴 때만 아래에서 노멀을 다시 계산한다 — 웨이브가 완전히
      // 가라앉은 평상시엔 매 프레임 O(n) 재계산 비용을 아예 안 쓴다.
      let maxAbsOffset = 0;

      const vertexCount = position.count;
      for (let i = 0; i < vertexCount; i++) {
        const ox = original[i * 3];
        const oy = original[i * 3 + 1];
        const oz = original[i * 3 + 2];

        // 여러 리플이 같은 자리를 겹쳐 지나갈 때 진폭을 그냥 더하면(합산) 순식간에
        // 과도하게 튀어나와 형태가 뭉개지므로, 그 순간 가장 강하게 미는 리플
        // 하나만 반영(최댓값)한다 — 깃발이 여러 번 겹쳐 접히는 대신 결이
        // 자연스럽게 이어지는 느낌을 준다.
        let target = 0;
        if (localRipples.length > 0) {
          for (const r of localRipples) {
            const dx = ox - r.local.x;
            const dy = oy - r.local.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > cutoffSq) continue; // 영향권 밖이면 sqrt/exp 계산 자체를 생략

            const dist = Math.sqrt(distSq);
            const waveRadius = r.age * rippleSpeed;
            const band = Math.exp(-((dist - waveRadius) ** 2) / (2 * bandWidth * bandWidth));
            target = Math.max(target, r.amplitude * band);
          }
        }

        // 목표값(현재 리플들의 합)으로 정점 오프셋을 부드럽게 댐핑 — 마우스가
        // 멈추거나 메시를 벗어나 target이 0이 돼도 통통 튀지 않고 서서히
        // 가라앉는다.
        const targetOffset = target * boundingRadius * RIPPLE_AMPLITUDE_FACTOR;
        offsets[i] = THREE.MathUtils.damp(offsets[i], targetOffset, OFFSET_DAMP_LAMBDA, delta);
        array[i * 3 + 2] = oz + offsets[i];

        const absOffset = Math.abs(offsets[i]);
        if (absOffset > maxAbsOffset) maxAbsOffset = absOffset;
      }

      position.needsUpdate = true;

      // 변형이 무시할 수준(바운딩 반지름의 0.05% 미만) 이상일 때만 노멀을
      // 다시 계산한다 — 마우스를 스치기만 해도 자연스럽게 스무스한 곡면이
      // 살짝 일렁이듯 보이고, 손을 떼고 웨이브가 가라앉으면 원본과 같은
      // 매끈한 셰이딩으로 조용히 복귀한다.
      if (maxAbsOffset > boundingRadius * 0.0005) {
        mesh.geometry.computeVertexNormals();
        anyEntryActive = true;
      }
    }

    if (!anyEntryActive && activeRipples.length === 0) {
      settledRef.current = true;
    } else {
      // 웨이브가 아직 진행/감쇠 중이면 다음 프레임도 계속 그려야 한다.
      invalidate();
    }
  });

  // 웨이브 인터랙션은 메시 표면 위에서 raycast가 실제로 맞을 때만 반응해야
  // 하므로, 히어로 컨테이너나 캔버스 전체의 mousemove가 아니라 이
  // primitive(로고 메시)에만 R3F 포인터 이벤트를 건다 — 배경/텍스트 등 다른
  // 영역에서는 애초에 이벤트 자체가 발생하지 않는다.
  const handlePointerMoveOnMesh = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const now = performance.now();
    const worldPoint = e.point.clone();
    const last = lastMoveRef.current;

    let speed = 0;
    if (last) {
      const dt = (now - last.time) / 1000;
      if (dt > 0) speed = worldPoint.distanceTo(last.point) / dt;
    }
    lastMoveRef.current = { point: worldPoint, time: now };

    if (now - lastSpawnAtRef.current < RIPPLE_SPAWN_INTERVAL_MS) return;
    lastSpawnAtRef.current = now;

    // 첫 진입 시점(last가 없을 때)엔 속도를 알 수 없으니 은은한 기본 세기로.
    const boundingRadius = waveMeshesRef.current[0]?.boundingRadius ?? 1;
    const speedNormalizer = boundingRadius * SPEED_NORMALIZER_FACTOR;
    const speedFactor = last ? THREE.MathUtils.clamp(speed / speedNormalizer, 0.4, 2.8) : 0.5;

    const ripples = ripplesRef.current;
    ripples.push({
      worldPoint,
      startTime: now / 1000,
      amplitude: speedFactor,
    });
    if (ripples.length > MAX_RIPPLES) ripples.shift();
    // 새 리플이 생겼으니 useFrame의 이른 리턴을 다시 풀어주고, demand
    // 모드에서 렌더가 멈춰 있었을 수 있으니 프레임을 하나 요청한다.
    settledRef.current = false;
    invalidate();
  };

  return (
    <group ref={spinRef} rotation={[0, BASE_ROTATION_Y, 0]}>
      <group ref={tiltRef} rotation={[BASE_TILT_X, 0, 0]}>
        <primitive object={scene} onPointerMove={handlePointerMoveOnMesh} />
      </group>
    </group>
  );
}

function Lighting() {
  return (
    <>
      {/* 이 모델은 자체 텍스처(크롬/실버 톤)를 그대로 보여주는 게 목적이라,
          조명은 색을 입히지 않고 중립(흰색/회색)으로 둔다 — 색을 넣으면
          베이스컬러 맵 위에 그대로 얹혀 원본과 다른 톤으로 보인다. */}
      <ambientLight intensity={0.34} color="#404040" />
      {/* 키 라이트 */}
      <directionalLight position={[4, 5, 6]} intensity={1.6} color="#ffffff" />
      {/* 반대편에서 은은하게 채워주는 필 라이트 */}
      <directionalLight position={[-5, -1.5, -3]} intensity={0.65} color="#b0b0b0" />
      {/* 카메라 반대편(피사체 뒤)에서 쏘는 림 라이트 — 얇은 부조의 테두리가
          도드라져 보이게 해서 두께감을 만든다. */}
      <pointLight position={[0, 2, -6]} intensity={2.5} color="#ffffff" />
    </>
  );
}

/** 로딩 중 캔버스 자리에 보여줄 블러 스켈레톤. 로드가 끝나면 서서히 사라진다. */
function LoaderOverlay() {
  const { active } = useProgress();
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700",
        active ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="h-[40%] w-[65%] max-w-[560px] animate-pulse rounded-[48px] bg-white/5 blur-2xl" />
    </div>
  );
}

export default function Hero3DLogo({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 화면 가시성을 ref로만 들고 있고 리렌더는 일으키지 않는다 — LogoModel의
  // useFrame이 매 프레임 이 값을 읽기만 하면 되므로, state로 만들어 굳이
  // React 리렌더를 유발할 필요가 없다.
  const visibleRef = useRef(true);
  // frameloop="demand"인 Canvas가 R3F 스토어를 만들면 onCreated로 그
  // invalidate 함수를 받아둔다 — 아래 IntersectionObserver(Canvas 바깥,
  // R3F 컨텍스트 밖)에서도 새 프레임을 요청할 수 있어야 하기 때문이다.
  const invalidateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      const wasVisible = visibleRef.current;
      visibleRef.current = entry.isIntersecting;
      // 화면 밖에 오래 있으면(특히 모바일 브라우저) 캔버스의 GPU 백킹
      // 버퍼가 메모리 절약을 위해 비워질 수 있어, 스크롤로 다시 들어와도
      // demand 모드에선 아무도 다시 그려달라고 요청하지 않는 한 그 빈
      // 화면이 그대로 남는다 — 다시 보이기 시작하는 순간 명시적으로 한
      // 프레임을 요청해 이 문제를 막는다.
      if (!wasVisible && entry.isIntersecting) invalidateRef.current?.();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={["absolute inset-0", className].join(" ")}>
      {/* 로고 지오메티리 자체(사각 모서리에서 뻗어 나온 스파이크/스우시 장식이
          좌우 비대칭)를 Bounds/Center가 "바운딩 박스" 기준으로 가운데
          맞추다 보니, 실제로 눈에 읽히는 워드마크 획 덩어리는 화면 중심보다
          왼쪽에 치우쳐 보였다 — Bounds가 매번 그 바운딩 박스 중심으로
          되돌리려 하므로 3D 트랜스폼으로는 보정이 상쇄돼버려서, 이미 렌더된
          캔버스 자체를 2D로 살짝 오른쪽으로 밀어 시각적 중심을 맞춘다. */}
      <div className="absolute inset-0" style={{ transform: "translateX(14.5%)" }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8.5], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        // 화면이 안 바뀌는 동안(대부분의 시간)엔 아예 다시 그리지 않는다 —
        // Bloom+ToneMapping 후처리까지 딸린 씬을 항상 60fps로 계속 그리던
        // 게 체감 렉의 큰 원인이었다. 스핀/틸트 보간과 웨이브가 진행 중일
        // 때만 LogoModel이 invalidate()로 다음 프레임을 요청한다.
        frameloop="demand"
        onCreated={(state) => {
          invalidateRef.current = state.invalidate;
        }}
      >
        <Lighting />
        <Suspense fallback={null}>
          {/* 원본 텍스처의 크롬/실버 톤을 그대로 살리기 위해, 색이 있는
              골든아워 프리셋 대신 중립적인 스튜디오 조명 HDRI를 쓴다. */}
          <Environment preset="studio" />
          {/* margin을 줄일수록 카메라가 모델에 더 바짝 맞춰져 화면에서 차지하는
              크기가 커진다 — fit 거리가 margin에 거의 비례하므로, 0.95를
              1.2로 나눈 값(약 0.79)을 주면 화면상 크기가 대략 20% 커진다.
              0.70으로 한 단계 더 낮춰 조금 더 크게 보이게 했다. */}
          <Bounds fit clip margin={0.7}>
            <Center>
              <LogoModel visibleRef={visibleRef} />
            </Center>
          </Bounds>
        </Suspense>
        {/* 메탈 로고의 밝은 하이라이트(림 라이트, 웨이브가 지나가는 부분)만
            luminanceThreshold를 넘겨 은은하게 번지도록 — 로고 전체를 흐릿하게
            만들지 않고 가장 밝은 지점만 살짝 도드라지게 한다. */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.15}
            luminanceThreshold={0.98}
            luminanceSmoothing={0.05}
            radius={0.2}
            mipmapBlur
            blendFunction={BlendFunction.SCREEN}
          />
          {/* 크롬 재질의 완전 반사(metalness:1, 낮은 roughness)가 환경맵의
              밝은 부분을 그대로 비추면서 흰색으로 뭉개지는데, 라이트/환경맵
              강도만 낮춰서는 거의 개선되지 않았다 — 렌더러의 toneMapping은
              캔버스 최종 출력에만 적용되고 이 포스트프로세싱 파이프라인
              내부(HDR 버퍼)에는 반영되지 않기 때문이다. 그래서 파이프라인
              안에 톤매핑을 직접 넣는다. whitePoint는 "이 값 이상이면 순백으로
              눌린다"는 상한선이라 값을 올릴수록 오히려 중간 톤은 더 어두워
              보일 수 있다 — 전체적인 노출(밝기)을 올리는 건 middleGrey
              쪽이라 이 값으로 밝기를 조절한다. */}
          <ToneMapping mode={ToneMappingMode.REINHARD2} whitePoint={3} middleGrey={0.9} />
        </EffectComposer>
      </Canvas>
      </div>
      <LoaderOverlay />
    </div>
  );
}
