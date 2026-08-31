// 관리자페이지 "사이트 콘텐츠"가 텅 비어있으면 실제 라이브 사이트에 뭐가 적용되어 있는지
// 알 수 없어 수정하기 어렵다 — 코드에 하드코딩된 기본값(Home.tsx/About.tsx/data/services.ts)을
// 그대로 site_content 테이블에 채워 넣어서, 관리자페이지를 열자마자 "지금 사이트에 보이는 값"이
// 그대로 보이게 하는 1회성 시드 스크립트.
// 실행: node scripts/seed-site-content.mjs  (.env의 SUPABASE_SERVICE_ROLE_KEY 필요)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(".env에 VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "portfolio-images";
const ASSETS_ROOT = path.join(__dirname, "..", "src", "assets");
const CONTENT_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

async function uploadImage(relPath, filename) {
  const filePath = path.join(ASSETS_ROOT, relPath);
  const buffer = readFileSync(filePath);
  const storagePath = `site-content/${filename}`;
  const ext = path.extname(filename).toLowerCase();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
    upsert: true,
  });
  if (error) throw new Error(`업로드 실패 (${storagePath}): ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function upsertText(key, value_text) {
  const { error } = await supabase.from("site_content").upsert({ key, value_text, value_image_url: null }, { onConflict: "key" });
  if (error) throw error;
  console.log(key, "-> 텍스트 저장 완료");
}

async function upsertImage(key, relPath, filename) {
  const url = await uploadImage(relPath, filename);
  const { error } = await supabase.from("site_content").upsert({ key, value_text: null, value_image_url: url }, { onConflict: "key" });
  if (error) throw error;
  console.log(key, "-> 이미지 저장 완료:", url);
}

// Home.tsx 기본값 그대로.
await upsertText("hero_heading", "The Web Designer\nfor Bold Visual Experiences");
await upsertText("hero_subtext", "Where creativity meets functionality for effortless user engagement");
await upsertImage("hero_image", "visual-img.jpg", "hero-image.jpg");

await upsertText(
  "intro_heading",
  "Design moves people. And people move the world. Design is not just what we see it’s how we feel, remember, and connect."
);
await upsertText(
  "intro_description",
  "사소한 요소 하나에도 의미를 담고, 그 안에서 공감과 연결의 순간을 만들어내는 디자인을 추구합니다. 나의 디자인은 '어떻게 보일까'보다 '어떻게 느껴질까'를 더 깊이 고민합니다. 저는 디자인을 통해 사람들의 하루에 잔잔한 변화를 만들고, 기억에 남는 경험과 진심이 닿는 브랜드를 만들어가고자 합니다."
);
await upsertText(
  "service_description",
  "저는 디자인을 '보여주는 일'이 아니라 '이해하고 연결하는 과정'이라 생각합니다. 기획부터 디자인, 퍼블리싱까지의 전 과정을 통해, 브랜드의 이야기가 사용자에게 자연스럽게 닿는 경험을 만들어갑니다."
);

// data/keywords.ts 기본값 4개 카드(소개 섹션 아래 키워드 그리드).
const KEYWORDS = [
  { n: 1, title: "선동 동력", sub: "Ability to Lead", file: "keyword/img-01.png", filename: "keyword-1.png" },
  { n: 2, title: "경험 유영", sub: "Experience Swimming", file: "keyword/img-02.png", filename: "keyword-2.png" },
  { n: 3, title: "구조적 심도", sub: "Structural Depth", file: "keyword/img-03.png", filename: "keyword-3.png" },
  { n: 4, title: "가치 확산", sub: "Spread of Value", file: "keyword/img-04.png", filename: "keyword-4.png" },
];

for (const kw of KEYWORDS) {
  await upsertText(`keyword_${kw.n}_title`, kw.title);
  await upsertText(`keyword_${kw.n}_sub`, kw.sub);
  await upsertImage(`keyword_${kw.n}_image`, kw.file, kw.filename);
}

// About.tsx 기본값.
await upsertText(
  "about_description",
  "언제나 남들과 다른 시각으로 디자인을 바라보며, 평범함 속에 숨겨진 새로운 가능성을 발견하고, 익숙한 것들에서 비범함을 이끌어냅니다."
);
await upsertImage("about_profile_image", "portfolio/profile.jpg", "about-profile.jpg");

// data/services.ts 기본값 3개 카드.
const SERVICES = [
  {
    n: 1,
    title: "Concept\nStrategy",
    file: "service/img-01.jpg",
    filename: "service-1.jpg",
    description:
      "디자인 이전에, ‘무엇을 왜 만드는가’를 가장 먼저 고민합니다. 브랜드의 본질과 목표를 이해하고, 사용자의 행동과 감정 흐름을 고려한 기획과 스토리 구조를 설계합니다. 모든 프로젝트는 이 과정을 통해 의미 있는 방향성을 갖게 됩니다.",
  },
  {
    n: 2,
    title: "Website\nDesign",
    file: "service/img-02.jpg",
    filename: "service-2.jpg",
    description:
      "사용자의 경험과 감정을 중심에 두고, 브랜드의 메시지가 명확히 전달되는 직관적이고 감성적인 웹디자인을 만듭니다. 단순히 ‘보여주는’ 디자인이 아니라, 사용자가 머물고 싶어지는 경험을 설계합니다.",
  },
  {
    n: 3,
    title: "Website\nPublishing",
    file: "service/img-03.jpg",
    filename: "service-3.jpg",
    description:
      "세밀한 구조와 완성도를 중요하게 생각하며, 디자인이 실제 화면 위에서 자연스럽게 구현되는 코드와 인터랙션을 제작합니다. 모든 디바이스에서 일관된 경험을 제공하기 위해 HTML, CSS, JavaScript를 활용한 정교한 구현력에 집중합니다.",
  },
];

for (const svc of SERVICES) {
  await upsertText(`service_${svc.n}_title`, svc.title);
  await upsertImage(`service_${svc.n}_image`, svc.file, svc.filename);
  await upsertText(`service_${svc.n}_description`, svc.description);
}

console.log("완료");
