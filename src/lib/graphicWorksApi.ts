import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { WorkItem } from "../data/works";

export interface GraphicWorkRow {
  id: string;
  title: string;
  date_label: string;
  caption: string;
  image_url: string;
  href: string;
  display_order: number;
}

export function mapGraphicWorkRowToWorkItem(row: GraphicWorkRow): WorkItem {
  return {
    title: row.title,
    date: row.date_label,
    sub: row.caption,
    image: row.image_url,
    href: row.href,
  };
}

// portfolioApi.ts와 같은 이유로 모듈 스코프에 캐싱한다 — PortfolioList 등 여러 화면이 같은
// 데이터를 공유하고, 관리자 페이지에서 수정한 뒤 refreshGraphicWorks()로 무효화한다.
let cachedRows: GraphicWorkRow[] | null = null;
let inFlight: Promise<GraphicWorkRow[]> | null = null;
const listeners = new Set<() => void>();

async function fetchAllGraphicWorksRows(): Promise<GraphicWorkRow[]> {
  const { data, error } = await supabase
    .from("graphic_works")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data as GraphicWorkRow[];
}

function load() {
  if (cachedRows || inFlight) return;
  inFlight = fetchAllGraphicWorksRows()
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

export function refreshGraphicWorks() {
  cachedRows = null;
  inFlight = null;
  load();
}

export function useGraphicWorks() {
  const [rows, setRows] = useState<GraphicWorkRow[] | null>(cachedRows);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const listener = () => {
      if (!cancelled) setRows(cachedRows);
    };
    listeners.add(listener);
    if (!cachedRows) {
      load();
      inFlight?.catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "그래픽 디자인 목록을 불러오지 못했습니다.");
      });
    }
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  return { rows, loading: rows === null && !error, error };
}
