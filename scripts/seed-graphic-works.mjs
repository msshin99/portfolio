// 기존 works.ts에 정적으로 박혀있던 GRAPIC DESIGN 3개 항목을 graphic_works 테이블로
// 이관하는 1회성 시드 스크립트.
// 실행: node scripts/seed-graphic-works.mjs  (.env의 SUPABASE_SERVICE_ROLE_KEY 필요)
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

const ASSETS_DIR = path.join(__dirname, "..", "src", "assets", "work");
const BUCKET = "portfolio-images";

async function uploadImage(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  const buffer = readFileSync(filePath);
  const storagePath = `graphic-works/${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`업로드 실패 (${storagePath}): ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

const ITEMS = [
  { title: "Chair Product Detail Page", date_label: "2024.11", caption: "Product Detail Page", file: "chair-pdp.jpg", href: "/portfolio/chairpdp" },
  { title: "Cosmetic Product Detail Page", date_label: "2023.06", caption: "Product Detail Page", file: "cosmetic-pdp.jpg", href: "/portfolio/cosmeticpdp" },
  { title: "Memory in frame", date_label: "2025.10", caption: "Logo design", file: "memory-in-frame.jpg", href: "https://www.behance.net/gallery/184760121/Memory-in-frame-brand-identity" },
];

for (const [index, item] of ITEMS.entries()) {
  const image_url = await uploadImage(item.file);
  const { error } = await supabase.from("graphic_works").insert({
    title: item.title,
    date_label: item.date_label,
    caption: item.caption,
    image_url,
    href: item.href,
    display_order: index,
  });
  if (error) throw error;
  console.log(item.title, "-> 등록 완료:", image_url);
}
