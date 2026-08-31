import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { ColorCard, FontGuide, FontInfoBlock, PortfolioDetail } from "../data/portfolioDetails";
import type { WorkItem } from "../data/works";

/** DB의 content_blocks jsonb 배열에 들어가는 섹션 타입들. 새 섹션 타입이 필요해지면
 *  여기 유니온에 추가하기만 하면 되고, portfolios 테이블 자체는 마이그레이션이 필요 없다. */
export type ContentBlock =
  | {
      type: "box_container";
      sub1_image_url: string;
      sub2_image_url: string;
      device_slides: { label: string; image_url: string }[];
    }
  | {
      type: "font_info";
      image_url: string;
      image_mobile_url: string;
      tight?: boolean;
      guides: {
        variant?: FontGuide["variant"];
        title: string;
        sample: string;
        weight: string;
        sizes: string[];
        letter_spacing: string;
        tags: string[];
      }[];
    }
  | {
      type: "color_info";
      description: string;
      cards: {
        name: string;
        hex_label: string;
        background: string;
        text_color?: string;
        border?: boolean;
      }[];
    }
  | { type: "main_image"; main_image_url: string };

export interface PortfolioRow {
  id: string;
  slug: string;
  title: string;
  list_caption: string;
  list_date_label: string;
  subtitle: string;
  description: string[];
  meta: { label: string; value: string; note?: string }[];
  website_url: string | null;
  hero_image_url: string | null;
  content_blocks: ContentBlock[];
  is_featured_on_main: boolean;
  main_display_order: number | null;
}

/** PortfolioDetailContent.tsx 등 기존 렌더링 컴포넌트는 그대로 두고, DB row를 기존
 *  PortfolioDetail 모양으로 변환해서 넘겨준다 — 렌더링 쪽 코드를 건드릴 필요가 없다. */
export function mapRowToPortfolioDetail(row: PortfolioRow): PortfolioDetail {
  const boxContainer = row.content_blocks.find((b) => b.type === "box_container");
  const fontBlocks = row.content_blocks.filter((b) => b.type === "font_info");
  const colorInfo = row.content_blocks.find((b) => b.type === "color_info");
  const mainImage = row.content_blocks.find((b) => b.type === "main_image");

  const fontInfoBlocks: FontInfoBlock[] = fontBlocks.map((b) => ({
    image: b.image_url,
    imageMobile: b.image_mobile_url,
    tight: b.tight,
    guides: b.guides.map((g) => ({
      variant: g.variant,
      title: g.title,
      sample: g.sample,
      weight: g.weight,
      sizes: g.sizes,
      letterSpacing: g.letter_spacing,
      tags: g.tags,
    })),
  }));

  const colorCards: ColorCard[] =
    colorInfo?.cards.map((c) => ({
      name: c.name,
      hexLabel: c.hex_label,
      background: c.background,
      textColor: c.text_color,
      border: c.border,
    })) ?? [];

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    meta: row.meta,
    websiteUrl: row.website_url ?? "",
    visual: row.hero_image_url ?? "",
    mainImage: mainImage?.main_image_url ?? "",
    boxContainer: {
      sub1: boxContainer?.sub1_image_url ?? "",
      sub2: boxContainer?.sub2_image_url ?? "",
      device: boxContainer?.device_slides.map((d) => ({ label: d.label, image: d.image_url })) ?? [],
    },
    fontInfoBlocks,
    colorInfo: { description: colorInfo?.description ?? "", cards: colorCards },
  };
}

/** WorkCard 그리드(리스트/메인/Related Projects)에 쓰는 WorkItem 모양으로 변환. */
export function mapRowToWorkItem(row: PortfolioRow): WorkItem {
  return {
    title: row.title,
    date: row.list_date_label,
    sub: row.list_caption,
    image: row.hero_image_url ?? "",
    href: `/portfolio/${row.slug}`,
  };
}

// 전체 portfolios를 한 번만 fetch해서 모듈 스코프에 캐싱하고, 이후 이 훅을 쓰는 모든
// 컴포넌트가 같은 캐시를 공유한다 — Home/PortfolioList/상세 모달이 각자 따로 fetch하면
// 상세 모달을 열 때 로딩이 한 번 더 끼어들어 기존의 "즉시 이어지는" shared-element 전환이
// 깨지기 때문에, 목록 화면이 뜬 시점에 이미 상세 콘텐츠까지 메모리에 있어야 한다.
let cachedRows: PortfolioRow[] | null = null;
let inFlight: Promise<PortfolioRow[]> | null = null;
const listeners = new Set<() => void>();

async function fetchAllPortfolios(): Promise<PortfolioRow[]> {
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as PortfolioRow[];
}

function loadPortfolios() {
  if (cachedRows || inFlight) return;
  inFlight = fetchAllPortfolios()
    .then((rows) => {
      cachedRows = rows;
      inFlight = null;
      listeners.forEach((fn) => fn());
      return rows;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
}

/** 관리자 페이지에서 등록/수정/삭제/순서 변경을 한 뒤 호출한다 — 캐시를 지우고 다시 fetch해서
 *  공개 사이트(Home/리스트/상세)가 같은 세션 안에서도 바로 최신 데이터를 보게 한다. */
export function refreshPortfolios() {
  cachedRows = null;
  inFlight = null;
  loadPortfolios();
}

/** 전체 portfolios 목록(캐시 공유). slug 조회/추천 노출/Prev-Next 순서 등 모든 화면이
 *  이 하나의 훅으로 통일해서 쓴다. */
export function usePortfolios() {
  const [rows, setRows] = useState<PortfolioRow[] | null>(cachedRows);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // refreshPortfolios()로 캐시가 나중에 무효화될 수 있으므로, 이미 데이터가 있어도
    // 항상 리스너로 등록해둬야 관리자 페이지에서 변경한 내용이 이미 마운트된 화면에도
    // 반영된다.
    let cancelled = false;
    const listener = () => {
      if (!cancelled) setRows(cachedRows);
    };
    listeners.add(listener);
    if (!cachedRows) {
      loadPortfolios();
      inFlight?.catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "포트폴리오를 불러오지 못했습니다.");
      });
    }
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  return { rows, loading: rows === null && !error, error };
}
