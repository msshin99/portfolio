// nordune/goalcheck/prmr 3개 프로젝트를 Supabase로 이관하는 1회성 시드 스크립트.
// 실행: node scripts/seed-portfolios.mjs  (.env의 SUPABASE_SERVICE_ROLE_KEY 필요)
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

const ASSETS_DIR = path.join(__dirname, "..", "src", "assets", "portfolio");
const BUCKET = "portfolio-images";

const CONTENT_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

async function uploadImage(slug, filename) {
  const filePath = path.join(ASSETS_DIR, slug, filename);
  const buffer = readFileSync(filePath);
  const storagePath = `${slug}/${filename}`;
  const ext = path.extname(filename);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
    upsert: true,
  });
  if (error) throw new Error(`업로드 실패 (${storagePath}): ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// portfolioDetails.ts의 실제 콘텐츠 구조를 그대로 옮긴다.
const PROJECTS = [
  {
    slug: "nordune",
    title: "Nordune",
    list_caption: "Furniture Webdesign",
    list_date_label: "2025.05",
    subtitle: "단순한 제품 소개를 넘어, 브랜드가 지향하는 삶의 방식",
    description: [
      "Nordune는 가구 그 자체보다, 그것이 놓인 공간과 조화를 이루는 분위기를 중요하게 생각합니다. 이에 따라 웹사이트는 텍스트보다 고해상도의 감각적인 이미지를 중심으로 구성되어 있으며, 이는 제품이 전달하는 감성적 가치와 공간미학을 보다 효과적으로 전달합니다. 사용자는 제품을 단순히 '구매의 대상'이 아닌, 하나의 라이프스타일 오브제로 인식하게 됩니다.",
      "웹사이트의 전반적인 흐름은 전통적인 커머스 플랫폼보다, 아트 디렉션이 살아있는 라이프스타일 매거진을 연상시키도록 설계되었습니다. 다양한 공간컷과 분위기 중심의 연출, 여백을 활용한 레이아웃, 그리고 시각적으로 조율된 타이포그래피는 사용자가 마치 한 편의 콘텐츠를 읽듯 브랜드를 경험하게 만듭니다. 이는 단순한 쇼핑의 기능을 넘어서, 브랜드와 감성적으로 연결되는 경험을 제공합니다.",
    ],
    meta: [
      { label: "Project", value: "가구 온라인 이커머스 플랫폼" },
      { label: "Role", value: "Website" },
      { label: "Contribution", value: "100%", note: "(1인 작업)" },
      { label: "Tools", value: "Figama , Html, Css, Js" },
      { label: "Period", value: "2025.05 – 2025.06" },
    ],
    website_url: "https://msshin99.github.io/Nordune/",
    heroImageFile: "visual.jpg",
    mainDisplayOrder: 1,
    contentBlocks: (urls) => [
      {
        type: "box_container",
        sub1_image_url: urls["sub-contents-01.jpg"],
        sub2_image_url: urls["sub-contents-02.jpg"],
        device_slides: [
          { label: "Mobile", image_url: urls["mobile-img.jpg"] },
          { label: "Tablet", image_url: urls["tablet-img.jpg"] },
          { label: "Pc", image_url: urls["pc-img.jpg"] },
        ],
      },
      {
        type: "font_info",
        image_url: urls["font.png"],
        image_mobile_url: urls["font-mo.png"],
        tight: false,
        guides: [
          {
            title: "Headline",
            sample: "we Design with purpose, creating experinces",
            weight: "Bold",
            sizes: ["116", "46", "40"],
            letter_spacing: "0%",
            tags: ["h2", "h3"],
          },
          {
            variant: "two",
            title: "Title",
            sample: "we Design with purpose, creating experinces",
            weight: "Medium",
            sizes: ["24", "20", "18"],
            letter_spacing: "0%",
            tags: ["h4", "h5", "p"],
          },
          {
            variant: "three",
            title: "Body",
            sample: "we Design with purpose, creating experinces",
            weight: "Regular",
            sizes: ["16", "14"],
            letter_spacing: "0%",
            tags: ["p", "button", "span", "a"],
          },
        ],
      },
      {
        type: "color_info",
        description:
          "컬러 시스템은 Black과 Gray의 단색 계열로 제한하였습니다. 이는 이미지가 주도하는 디자인 구조를 돋보이게 하고, 시각적 산만함을 최소화하며 브랜드가 지향하는 절제된 고급감을 표현합니다. 블랙은 구조적 깊이와 프리미엄 가치를 상징하고, 그레이는 제품과 공간의 경계를 부드럽게 연결하여 전체적인 화면에 시각적 통일성과 세련된 리듬감을 부여합니다.",
        cards: [
          { name: "Black", hex_label: "#000000", background: "#000" },
          { name: "Dark Gray", hex_label: "#767676", background: "#767676" },
          { name: "Light Gray", hex_label: "#99999", background: "#999" },
          { name: "Dark White", hex_label: "#F7F8F9", background: "#f7f8f9", text_color: "#505050" },
          { name: "White", hex_label: "#ffffff", background: "#fff", text_color: "#505050", border: true },
        ],
      },
      { type: "main_image", bg_image_url: urls["bg-img.jpg"], main_image_url: urls["main-img.jpg"] },
    ],
    imageFiles: [
      "visual.jpg",
      "bg-img.jpg",
      "main-img.jpg",
      "sub-contents-01.jpg",
      "sub-contents-02.jpg",
      "mobile-img.jpg",
      "tablet-img.jpg",
      "pc-img.jpg",
      "font.png",
      "font-mo.png",
    ],
  },
  {
    slug: "goalcheck",
    title: "Goal Check",
    list_caption: "해외 축구 정보의 신뢰도 검증 및 큐레이션 플랫폼",
    list_date_label: "2025.7",
    subtitle: "신뢰의 기준이 되는, 해외 축구 정보의 교차 검증 플랫폼",
    description: [
      "해외 축구는 이제 단순한 스포츠를 넘어 한국 팬들의 일상과 문화로 자리 잡았습니다. 손흥민, 김민재, 이강인 등 세계 무대에서 활약하는 선수들이 늘어나면서 해외 축구에 대한 관심과 팬덤도 빠르게 확산되고 있습니다.",
      "하지만 국내에 전달되는 해외 축구 뉴스 중에는 추측성 보도나 근거 없는 루머도 적지 않아, 팬들이 사실 여부를 판단하기 어려운 현실입니다.",
      "이에 저희 플랫폼은 신뢰할 수 있는 기자와 매체의 보도만을 선별하고, 기사마다 출처의 공신력을 평가할 수 있는 기준을 제공합니다. 팬들은 단순히 뉴스를 소비하는 것이 아니라, '누가 말했는가', '그 출처가 얼마나 신뢰할 만한가'를 명확히 확인할 수 있습니다. 저희의 목표는 해외 축구 소식을 단순히 빠르게 전달하는 것이 아니라, 정확성과 신뢰성을 기반으로 팬들이 올바른 정보를 통해 해외 축구를 더욱 깊이 있게 즐길 수 있도록 돕는 것입니다.",
    ],
    meta: [
      { label: "Project", value: "해외 축구 정보의 신뢰도 검증 및 큐레이션 플랫폼" },
      { label: "Role", value: "Website" },
      { label: "Contribution", value: "100%", note: "(1인 작업)" },
      { label: "Tools", value: "Figama , Html, Css, Js" },
      { label: "Period", value: "2025.06 – 2025.07" },
    ],
    website_url: "https://msshin99.github.io/GoalCheck/",
    heroImageFile: "visual.jpg",
    mainDisplayOrder: 2,
    contentBlocks: (urls) => [
      {
        type: "box_container",
        sub1_image_url: urls["sub-contents-01.png"],
        sub2_image_url: urls["sub-contents-02.jpg"],
        device_slides: [
          { label: "Mobile", image_url: urls["mobile-img.jpg"] },
          { label: "Tablet", image_url: urls["tablet-img.jpg"] },
          { label: "Pc", image_url: urls["pc-img.jpg"] },
        ],
      },
      {
        type: "font_info",
        image_url: urls["font.png"],
        image_mobile_url: urls["font-mo.png"],
        tight: false,
        guides: [
          {
            title: "메인 타이틀",
            sample: "해외 축구 기자들의 정확한 신뢰도를 판단합니다",
            weight: "Bold",
            sizes: ["32"],
            letter_spacing: "-2.5%",
            tags: ["h2"],
          },
          {
            variant: "two",
            title: "콘텐츠 제목",
            sample: "해외 축구 기자들의 정확한 신뢰도를 판단합니다",
            weight: "Medium",
            sizes: ["24", "20", "18"],
            letter_spacing: "-2.5%%",
            tags: ["h3", "h4", "p"],
          },
          {
            variant: "three",
            title: "본문 텍스트",
            sample: "해외 축구 기자들의 정확한 신뢰도를 판단합니다",
            weight: "Regular",
            sizes: ["18", "16", "14"],
            letter_spacing: "-2.5%",
            tags: ["p", "button", "span", "a"],
          },
        ],
      },
      {
        type: "color_info",
        description:
          "컬러 시스템은 Black과 Gray의 단색 계열로 제한하였습니다. 이는 이미지가 주도하는 디자인 구조를 돋보이게 하고, 시각적 산만함을 최소화하며 브랜드가 지향하는 절제된 고급감을 표현합니다. 블랙은 구조적 깊이와 프리미엄 가치를 상징하고, 그레이는 제품과 공간의 경계를 부드럽게 연결하여 전체적인 화면에 시각적 통일성과 세련된 리듬감을 부여합니다.",
        cards: [
          { name: "Blue", hex_label: "#006bff", background: "#006bff" },
          { name: "Green", hex_label: "#13a24f", background: "#13a24f" },
          { name: "black", hex_label: "#191f28", background: "#191f28" },
          { name: "Gray", hex_label: "#6b7684", background: "#6b7684" },
          { name: "Light Gray", hex_label: "#B0B8C1", background: "#b0b8c1" },
        ],
      },
      { type: "main_image", bg_image_url: urls["bg-img.jpg"], main_image_url: urls["main-img.jpg"] },
    ],
    imageFiles: [
      "visual.jpg",
      "bg-img.jpg",
      "main-img.jpg",
      "sub-contents-01.png",
      "sub-contents-02.jpg",
      "mobile-img.jpg",
      "tablet-img.jpg",
      "pc-img.jpg",
      "font.png",
      "font-mo.png",
    ],
  },
  {
    slug: "prmr",
    title: "PRMR",
    list_caption: "Cosmetic Ecommerce redesign",
    list_date_label: "2025.10",
    subtitle: "프리미엄 가치와 구매 효율을 높인: 프리메라 공식 이커머스 웹사이트 리디자인",
    description: [
      "초기 웹사이트는 프리메라가 지향하는 고급스럽고 자연주의적인 디자인 컨셉 및 브랜드 아이덴티티가 명확히 드러나지 않았습니다. 또한, 사용자들이 필수적으로 찾는 가격, 평점, 리뷰 등의 핵심 제품 정보가 UI/UX 측면에서 비효율적으로 배치되어 탐색이 불편했습니다. 이와 더불어 부족한 콘텐츠로 인해 이커머스 웹사이트 전체의 활기가 떨어지는 상황이었습니다.",
      "리디자인을 통해 기존 웹사이트의 비효율적인 정보 구조와 부실했던 콘텐츠를 보완했습니다. 그 결과, 프리메라의 고급스러운 정체성이 디자인에 반영되었고, 사용자에게 필요한 정보가 명확하게 전달되는 활발하고 사용자 친화적인 이커머스 플랫폼으로 성공적인 변화를 이끌어냈습니다.",
    ],
    meta: [
      { label: "Project", value: "가구 온라인 이커머스 플랫폼" },
      { label: "Role", value: "Website" },
      { label: "Contribution", value: "100%", note: "(1인 작업)" },
      { label: "Tools", value: "Figama , Html, Css, Js" },
      { label: "Period", value: "2025.09 – 2025.10" },
    ],
    website_url: "https://msshin99.github.io/prmr/",
    heroImageFile: "visual.jpg",
    mainDisplayOrder: 3,
    contentBlocks: (urls) => [
      {
        type: "box_container",
        sub1_image_url: urls["sub-contents-01.png"],
        sub2_image_url: urls["sub-contents-02.jpg"],
        device_slides: [
          { label: "Mobile", image_url: urls["mobile-img.jpg"] },
          { label: "Tablet", image_url: urls["tablet-img.jpg"] },
          { label: "Pc", image_url: urls["pc-img.jpg"] },
        ],
      },
      {
        type: "font_info",
        image_url: urls["font.png"],
        image_mobile_url: urls["font-mo.png"],
        tight: true,
        guides: [
          {
            title: "메인 타이틀",
            sample: "모든 아름다움의 시작, 씨앗이 품은 그대로의 생명력",
            weight: "Semi Bold",
            sizes: ["42", "28"],
            letter_spacing: "-2.5%",
            tags: ["h2", "h3"],
          },
          {
            variant: "two",
            title: "콘텐츠 제목",
            sample: "모든 아름다움의 시작, 씨앗이 품은 그대로의 생명력",
            weight: "Medium",
            sizes: ["26", "24", "20", "18"],
            letter_spacing: "-2.5%",
            tags: ["h4", "h5", "p"],
          },
          {
            variant: "three",
            title: "본문 텍스트",
            sample: "모든 아름다움의 시작, 씨앗이 품은 그대로의 생명력",
            weight: "Light",
            sizes: ["18", "16", "14"],
            letter_spacing: "-2.5%",
            tags: ["p", "button", "span", "a"],
          },
        ],
      },
      {
        type: "font_info",
        image_url: urls["font02.png"],
        image_mobile_url: urls["font02-mo.png"],
        tight: false,
        guides: [
          {
            variant: "prmr",
            title: "Headline",
            sample: "The beginning of all beauty, the vitality held within the seed",
            weight: "Regular",
            sizes: ["70", "56", "40"],
            letter_spacing: "0",
            tags: ["h2", "h3"],
          },
        ],
      },
      {
        type: "color_info",
        description:
          "기존 프리메라 웹사이트에서 포인트 색상으로 사용되던 오리지널 컬러 #E0630B를 유지하되, 사용 방식과 비주얼 톤앤매너를 완전히 재해석했습니다. 기존에는 단순히 기능적인 요소에만 적용되어 웹사이트의 전반적인 고급스러움을 해치는 요소로 작용했다면, 리디자인에서는 이 색상을 '자연의 생명력과 활력'을 상징하는 핵심 액센트로 활용했습니다.",
        cards: [
          { name: "Orange", hex_label: "#E0630B", background: "#e0630b" },
          { name: "Black", hex_label: "#111111", background: "#111111" },
          { name: "Dark Gray", hex_label: "#505050", background: "#505050" },
          { name: "Gray", hex_label: "#767676", background: "#767676" },
          { name: "White", hex_label: "#ffffff", background: "#fff", text_color: "#505050", border: true },
        ],
      },
      { type: "main_image", bg_image_url: urls["bg-img.jpg"], main_image_url: urls["main-img.jpg"] },
    ],
    imageFiles: [
      "visual.jpg",
      "bg-img.jpg",
      "main-img.jpg",
      "sub-contents-01.png",
      "sub-contents-02.jpg",
      "mobile-img.jpg",
      "tablet-img.jpg",
      "pc-img.jpg",
      "font.png",
      "font-mo.png",
      "font02.png",
      "font02-mo.png",
    ],
  },
];

async function seedProject(project) {
  console.log(`\n[${project.slug}] 이미지 업로드 중...`);
  const urls = {};
  for (const filename of project.imageFiles) {
    urls[filename] = await uploadImage(project.slug, filename);
    console.log(`  ✓ ${filename}`);
  }

  const row = {
    slug: project.slug,
    title: project.title,
    list_caption: project.list_caption,
    list_date_label: project.list_date_label,
    subtitle: project.subtitle,
    description: project.description,
    meta: project.meta,
    website_url: project.website_url,
    hero_image_url: urls[project.heroImageFile],
    content_blocks: project.contentBlocks(urls),
    is_featured_on_main: true,
    main_display_order: project.mainDisplayOrder,
  };

  const { error } = await supabase.from("portfolios").upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`[${project.slug}] insert 실패: ${error.message}`);
  console.log(`[${project.slug}] portfolios row 등록 완료`);
}

for (const project of PROJECTS) {
  await seedProject(project);
}

console.log("\n모든 시드 데이터 이관 완료.");
