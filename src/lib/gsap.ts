import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);

// GSAP 기본값(500ms 넘게 프레임이 벌어지면 그 프레임의 delta를 33ms로 강제
// 축소)은 "탭이 백그라운드에 있다 돌아왔을 때 애니메이션이 한 프레임에 확
// 점프하는 것"을 막기 위한 안전장치다. 그런데 이 사이트는 Preloader가
// 화면을 덮은 채로 무거운 캔버스/WebGL 렌더링이 겹치는 구간이 있어서,
// 저사양 기기나 탭 전환 없이도 프레임이 자주 벌어질 수 있다 — 그때마다
// delta가 33ms로 깎이면 GSAP 타임라인 전체가 실제 경과 시간보다 훨씬
// 느리게(체감 1.3~1.5배) 흘러서, 계산상 몇 초로 맞춰둔 인트로가 실제로는
// 훨씬 길게 늘어나 버렸다. 이 프로젝트의 개별 rAF 루프(Hero3DLogo,
// HeroEmbers 등)는 이미 각자 delta를 안전하게 clamp하고 있으므로, GSAP
// 전역 타임라인에서는 이 안전장치를 끄고 실제 흐른 시간을 그대로 반영해
// "인트로는 최대 몇 초 안에 끝난다"는 걸 보장한다.
gsap.ticker.lagSmoothing(false);

/** 파티클 인트로(Preloader)가 글자 모임 -> 그리드 재배열 트윈에 공통으로 쓰는 이징.
 *  처음엔 cubic-bezier(0.25, 0.1, 0.25, 1)(=CSS 기본 ease)로 스냅감 있게 만들었는데,
 *  지속시간이 짧게 붙으니 "급하게 튕기는" 느낌이 강했다 — 도착부에서 아주 천천히
 *  잦아드는 expo-out 계열(0.16, 1, 0.3, 1)로 바꿔서, 파티클이 미끄러지듯 부드럽게
 *  제자리에 안착하는 느낌을 낸다(이 사이트의 다른 reveal 애니메이션에서도 쓰는 커브). */
CustomEase.create("particleEase", "0.16, 1, 0.3, 1");

/** 포트폴리오 썸네일 등장 등, 살짝 오버슈트(도착 직전 튕겼다가 안착)하는
 *  spring 느낌이 필요한 리빌 애니메이션에 공용으로 쓰는 이징. */
CustomEase.create("revealSpring", "0.34, 1.56, 0.64, 1");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Tailwind의 `max-sm:`과 같은 기준(640px 미만)으로 모바일 뷰포트인지 판단한다.
 *  스크롤로 화면을 벗어날 때마다 리빌 애니메이션을 처음부터 다시 재생하는
 *  컴포넌트들(Reveal/StaggerReveal/IntroTop/WorkCard)이, 모바일에서는 한 번
 *  나타난 뒤로는 다시 숨기지 않도록(재생 1회로 제한) 분기하는 데 쓴다 — 화면이
 *  작아 스크롤을 자주 오르내리는 모바일에서, 다시 사라졌다 나타나길 반복하는
 *  동안 빈 화면만 보게 되는 체감 시간이 길다는 피드백에 따른 것이다. */
export const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

export { gsap, ScrollTrigger, CustomEase };
