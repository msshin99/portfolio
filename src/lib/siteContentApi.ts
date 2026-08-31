import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export interface SiteContentRow {
  id: string;
  key: string;
  value_text: string | null;
  value_image_url: string | null;
}

// portfolioApi.ts와 같은 패턴: 한 번 fetch해서 모듈 스코프에 캐싱하고 모든 컴포넌트가 공유한다.
let cached: SiteContentRow[] | null = null;
let inFlight: Promise<SiteContentRow[]> | null = null;
const listeners = new Set<() => void>();

async function fetchAll(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase.from("site_content").select("*");
  if (error) throw error;
  return data as SiteContentRow[];
}

function load() {
  if (cached || inFlight) return;
  inFlight = fetchAll()
    .then((rows) => {
      cached = rows;
      inFlight = null;
      listeners.forEach((fn) => fn());
      return rows;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
}

/** 관리자 페이지에서 site_content를 등록/수정/삭제한 뒤 호출해서 공개 사이트 캐시를 갱신한다. */
export function refreshSiteContent() {
  cached = null;
  inFlight = null;
  load();
}

export function useSiteContent() {
  const [rows, setRows] = useState<SiteContentRow[] | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const listener = () => {
      if (!cancelled) setRows(cached);
    };
    listeners.add(listener);
    if (!cached) {
      load();
      inFlight?.catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "콘텐츠를 불러오지 못했습니다.");
      });
    }
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  return { rows, loading: rows === null && !error, error };
}

/** key에 해당하는 텍스트 값. DB에 아직 없거나 비어있으면 fallback을 그대로 쓴다 — 관리자가
 *  한 번도 안 건드린 상태에서도 사이트가 항상 정상적인 기본 문구로 보이게 하기 위함. */
export function getSiteText(rows: SiteContentRow[] | null, key: string, fallback: string): string {
  const row = rows?.find((r) => r.key === key);
  return row?.value_text?.trim() ? row.value_text : fallback;
}

export function getSiteImage(rows: SiteContentRow[] | null, key: string, fallback: string): string {
  const row = rows?.find((r) => r.key === key);
  return row?.value_image_url?.trim() ? row.value_image_url : fallback;
}
