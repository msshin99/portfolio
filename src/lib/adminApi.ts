import { supabase } from "./supabaseClient";
import type { ContentBlock, PortfolioRow } from "./portfolioApi";
import type { SiteContentRow } from "./siteContentApi";
import type { GraphicWorkRow } from "./graphicWorksApi";

const BUCKET = "portfolio-images";

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 관리자 폼에서 이미지 파일을 고르면 바로 업로드하고 public URL을 돌려준다.
 *  파일명이 겹치지 않도록 타임스탬프를 붙인다. */
export async function uploadPortfolioImage(slug: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${slug || "draft"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchAllSiteContent(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase.from("site_content").select("*").order("key");
  if (error) throw error;
  return data as SiteContentRow[];
}

export async function upsertSiteContent(row: {
  key: string;
  value_text: string | null;
  value_image_url: string | null;
}): Promise<void> {
  const { error } = await supabase.from("site_content").upsert(row, { onConflict: "key" });
  if (error) throw error;
}

export async function deleteSiteContent(key: string): Promise<void> {
  const { error } = await supabase.from("site_content").delete().eq("key", key);
  if (error) throw error;
}

export async function fetchPortfolioById(id: string): Promise<PortfolioRow | null> {
  const { data, error } = await supabase.from("portfolios").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as PortfolioRow | null;
}

export type PortfolioInput = Omit<PortfolioRow, "id">;

export async function createPortfolio(input: PortfolioInput): Promise<PortfolioRow> {
  const { data, error } = await supabase.from("portfolios").insert(input).select().single();
  if (error) throw error;
  return data as PortfolioRow;
}

export async function updatePortfolio(id: string, input: PortfolioInput): Promise<PortfolioRow> {
  const { data, error } = await supabase.from("portfolios").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as PortfolioRow;
}

export async function deletePortfolio(id: string): Promise<void> {
  const { error } = await supabase.from("portfolios").delete().eq("id", id);
  if (error) throw error;
}

/** 새 포트폴리오를 만들 때 리스트 맨 뒤에 붙도록, 현재 가장 큰 list_display_order + 1을
 *  돌려준다(등록된 게 없으면 0). */
export async function getNextListDisplayOrder(): Promise<number> {
  const { data, error } = await supabase
    .from("portfolios")
    .select("list_display_order")
    .order("list_display_order", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data.length ? data[0].list_display_order + 1 : 0;
}

/** 관리자 "전체 포트폴리오" 표에서 드래그로 재배열한 순서를 list_display_order(0부터)로
 *  그대로 반영한다. */
export async function reorderPortfolioList(idsInOrder: string[]): Promise<void> {
  for (const [index, id] of idsInOrder.entries()) {
    const { error } = await supabase.from("portfolios").update({ list_display_order: index }).eq("id", id);
    if (error) throw error;
  }
}

/** 메인 노출 토글 + 순서 일괄 반영. 같은 main_display_order 값을 두 행이 동시에 잠깐이라도
 *  가지면 unique index에 걸리므로, 항상 "전부 해제 후 다시 채우는" 순서로 두 단계에 걸쳐
 *  업데이트한다. */
export async function updateFeaturedOrder(
  featuredSlugsInOrder: string[],
  allSlugs: string[]
): Promise<void> {
  const toClear = allSlugs.filter((slug) => !featuredSlugsInOrder.includes(slug));
  if (toClear.length > 0) {
    const { error } = await supabase
      .from("portfolios")
      .update({ is_featured_on_main: false, main_display_order: null })
      .in("slug", toClear);
    if (error) throw error;
  }

  // 먼저 전부 order를 null로 비워서, 이후 재배정 시 unique index(featured 중 order 유일)와
  // 충돌하지 않게 한다.
  if (featuredSlugsInOrder.length > 0) {
    const { error: clearError } = await supabase
      .from("portfolios")
      .update({ main_display_order: null })
      .in("slug", featuredSlugsInOrder);
    if (clearError) throw clearError;

    for (const [index, slug] of featuredSlugsInOrder.entries()) {
      const { error } = await supabase
        .from("portfolios")
        .update({ is_featured_on_main: true, main_display_order: index + 1 })
        .eq("slug", slug);
      if (error) throw error;
    }
  }
}

export async function fetchAllGraphicWorks(): Promise<GraphicWorkRow[]> {
  const { data, error } = await supabase.from("graphic_works").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data as GraphicWorkRow[];
}

export type GraphicWorkInput = Omit<GraphicWorkRow, "id">;

export async function createGraphicWork(input: GraphicWorkInput): Promise<GraphicWorkRow> {
  const { data, error } = await supabase.from("graphic_works").insert(input).select().single();
  if (error) throw error;
  return data as GraphicWorkRow;
}

export async function updateGraphicWork(id: string, input: GraphicWorkInput): Promise<GraphicWorkRow> {
  const { data, error } = await supabase.from("graphic_works").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as GraphicWorkRow;
}

export async function deleteGraphicWork(id: string): Promise<void> {
  const { error } = await supabase.from("graphic_works").delete().eq("id", id);
  if (error) throw error;
}

/** 드래그로 재배열한 순서를 display_order(0부터)로 그대로 반영한다. */
export async function reorderGraphicWorks(idsInOrder: string[]): Promise<void> {
  for (const [index, id] of idsInOrder.entries()) {
    const { error } = await supabase.from("graphic_works").update({ display_order: index }).eq("id", id);
    if (error) throw error;
  }
}

/** 그래픽 디자인 항목에 메인 이미지를 넣으면 /portfolio/{slug} 상세페이지가 자동 생기는데,
 *  이 URL 공간은 portfolios.slug와 공유한다(둘 다 PortfolioSlug.tsx가 처리). 두 테이블의
 *  slug가 겹치면 어느 한쪽 페이지가 가려지므로, 두 테이블을 모두 확인해서 겹치면
 *  "-2", "-3"처럼 숫자를 붙여 고유하게 만든다. */
export async function generateUniqueGraphicWorkSlug(title: string): Promise<string> {
  const base = slugify(title) || "graphic";
  let candidate = base;
  let suffix = 2;
  // 두 테이블에 동시에 존재 여부를 물어야 하므로, 후보가 정해질 때마다 순차적으로 확인한다.
  for (;;) {
    const [{ data: portfolioMatch, error: portfolioError }, { data: graphicMatch, error: graphicError }] = await Promise.all([
      supabase.from("portfolios").select("id").eq("slug", candidate).maybeSingle(),
      supabase.from("graphic_works").select("id").eq("slug", candidate).maybeSingle(),
    ]);
    if (portfolioError) throw portfolioError;
    if (graphicError) throw graphicError;
    if (!portfolioMatch && !graphicMatch) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

/** PortfolioForm이 다루는 "고정 섹션" 편집 상태를 content_blocks 배열로 조립한다.
 *  렌더링 쪽(mapRowToPortfolioDetail)이 기대하는 순서: box_container -> font_info(들) ->
 *  color_info -> main_image. */
export function assembleContentBlocks(sections: {
  boxContainer: Extract<ContentBlock, { type: "box_container" }> | null;
  fontInfoBlocks: Extract<ContentBlock, { type: "font_info" }>[];
  colorInfo: Extract<ContentBlock, { type: "color_info" }> | null;
  mainImage: Extract<ContentBlock, { type: "main_image" }> | null;
}): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  if (sections.boxContainer) blocks.push(sections.boxContainer);
  blocks.push(...sections.fontInfoBlocks);
  if (sections.colorInfo) blocks.push(sections.colorInfo);
  if (sections.mainImage) blocks.push(sections.mainImage);
  return blocks;
}
