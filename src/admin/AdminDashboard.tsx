import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabaseClient";
import { deletePortfolio, updateFeaturedOrder } from "../lib/adminApi";
import { refreshPortfolios, type PortfolioRow } from "../lib/portfolioApi";
import { AlertIcon, ExternalLinkIcon, GridIcon, GripIcon, PencilIcon, PlusIcon, StarIcon, TrashIcon } from "./icons";
import { Badge, Button, Card, EmptyState, InfoBanner, PageHeader } from "./ui";

const MAX_FEATURED = 6;

function SortableFeaturedRow({ row, index, onRemove }: { row: PortfolioRow; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 10 : "auto" }}
      className={`flex items-center gap-4 bg-white rounded-xl border px-4 py-3.5 ${isDragging ? "border-[#4f46e5]/30 shadow-lg" : "border-black/[0.06]"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#c4c4cc] hover:text-[#71717a] select-none p-1 touch-none"
        aria-label="순서 변경"
      >
        <GripIcon className="w-5 h-5" />
      </button>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#4f46e5]/10 text-xs font-semibold text-[#4f46e5]">
        {index + 1}
      </span>
      <img src={row.hero_image_url ?? ""} alt="" className="w-20 h-14 object-cover rounded-md bg-[#f0f0f5]" />
      <span className="flex-1 text-[15px] font-medium text-[#18181b] truncate">{row.title}</span>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        노출 해제
      </Button>
    </li>
  );
}

export default function AdminDashboard() {
  const [rows, setRows] = useState<PortfolioRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function load() {
    const { data, error } = await supabase.from("portfolios").select("*").order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setRows(data as PortfolioRow[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(row: PortfolioRow) {
    if (!confirm(`"${row.title}"을(를) 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    try {
      await deletePortfolio(row.id);
      refreshPortfolios();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  async function persistFeatured(nextFeatured: PortfolioRow[]) {
    if (!rows) return;
    setNotice(null);
    try {
      await updateFeaturedOrder(
        nextFeatured.map((r) => r.slug),
        rows.map((r) => r.slug)
      );
      refreshPortfolios();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "노출 순서 저장에 실패했습니다.");
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
        <AlertIcon className="w-4 h-4 shrink-0" />
        {error}
      </div>
    );
  }
  if (!rows) {
    return <div className="py-20 text-center text-sm text-[#a1a1aa]">불러오는 중...</div>;
  }

  const featured = rows
    .filter((r) => r.is_featured_on_main)
    .sort((a, b) => (a.main_display_order ?? 0) - (b.main_display_order ?? 0));
  const notFeatured = rows.filter((r) => !r.is_featured_on_main);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = featured.findIndex((r) => r.id === active.id);
    const newIndex = featured.findIndex((r) => r.id === over.id);
    const reordered = arrayMove(featured, oldIndex, newIndex);
    persistFeatured(reordered);
  }

  function handleToggleFeatured(row: PortfolioRow, checked: boolean) {
    if (checked) {
      if (featured.length >= MAX_FEATURED) {
        setNotice(`메인 노출은 최대 ${MAX_FEATURED}개까지만 선택할 수 있습니다.`);
        return;
      }
      persistFeatured([...featured, row]);
    } else {
      persistFeatured(featured.filter((r) => r.id !== row.id));
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="포트폴리오 관리"
        description="메인 노출 순서를 정리하고 포트폴리오를 추가・수정・삭제합니다."
        action={
          <Link
            to="/admin/portfolios/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#4f46e5] px-5 h-11 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            새 포트폴리오
          </Link>
        }
      />

      <InfoBanner title="이 페이지 사용법">
        먼저 <b>새 포트폴리오</b> 버튼으로 작업물을 등록하고, 아래 <b>전체 포트폴리오</b> 표에서 홈페이지에 보여주고 싶은 항목의
        <b> 메인 노출</b> 체크박스를 켜세요. 체크된 항목은 위쪽 <b>메인 노출 순서</b>에 나타나며, 그 순서 그대로 홈페이지 상단에
        표시됩니다. 순서를 바꾸고 싶으면 카드를 드래그하면 됩니다.
      </InfoBanner>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#18181b]">
            <StarIcon className="w-[18px] h-[18px] text-[#4f46e5]" />
            메인 노출 순서
          </h2>
          <Badge tone="accent">{featured.length}/{MAX_FEATURED}</Badge>
        </div>
        <p className="text-[15px] text-[#a1a1aa] mb-5">
          홈페이지에 이 순서대로 노출됩니다 (최대 {MAX_FEATURED}개). 드래그해서 순서를 바꾸면 바로 저장됩니다.
        </p>
        {notice && (
          <div className="flex items-center gap-2 rounded-lg bg-[#fffbeb] px-3.5 py-2.5 text-sm text-[#b45309] mb-5">
            <AlertIcon className="w-4 h-4 shrink-0" />
            {notice}
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={featured.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {featured.map((row, i) => (
                <SortableFeaturedRow key={row.id} row={row} index={i} onRemove={() => handleToggleFeatured(row, false)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {featured.length === 0 && (
          <EmptyState title="메인에 노출 중인 포트폴리오가 없습니다" description="아래 목록에서 체크박스를 선택하세요." />
        )}
      </Card>

      <Card className="p-8">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#18181b] mb-1.5">
          <GridIcon className="w-[18px] h-[18px] text-[#4f46e5]" />
          전체 포트폴리오
        </h2>
        <p className="text-[15px] text-[#a1a1aa] mb-5">등록된 모든 작업물입니다. 체크박스로 홈페이지 노출 여부를 바로 바꿀 수 있습니다.</p>
        {rows.length === 0 ? (
          <EmptyState
            icon={<GridIcon className="w-8 h-8" />}
            title="등록된 포트폴리오가 없습니다"
            description="오른쪽 위 '새 포트폴리오' 버튼을 눌러 첫 작업물을 등록해보세요."
          />
        ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[15px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[#a1a1aa]">
                <th className="py-3 px-2 font-medium text-xs uppercase tracking-wide">썸네일</th>
                <th className="py-3 px-2 font-medium text-xs uppercase tracking-wide">제목</th>
                <th className="py-3 px-2 font-medium text-xs uppercase tracking-wide">slug</th>
                <th className="py-3 px-2 font-medium text-xs uppercase tracking-wide text-center" title="홈페이지 상단에 노출할지 여부">
                  메인 노출
                </th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {[...featured, ...notFeatured].map((row) => (
                <tr key={row.id} className="group">
                  <td className="py-3.5 px-2 border-t border-black/[0.05]">
                    <img src={row.hero_image_url ?? ""} alt="" className="w-20 h-14 object-cover rounded-md bg-[#f0f0f5]" />
                  </td>
                  <td className="py-3.5 px-2 border-t border-black/[0.05] text-[#18181b] font-medium">{row.title}</td>
                  <td className="py-3.5 px-2 border-t border-black/[0.05] text-[#a1a1aa]">
                    <span className="inline-flex items-center gap-1.5">
                      /portfolio/{row.slug}
                      <a
                        href={`/portfolio/${row.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#c4c4cc] hover:text-[#4f46e5]"
                      >
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    </span>
                  </td>
                  <td className="py-3.5 px-2 border-t border-black/[0.05] text-center">
                    <input
                      type="checkbox"
                      checked={row.is_featured_on_main}
                      onChange={(e) => handleToggleFeatured(row, e.target.checked)}
                      className="h-[18px] w-[18px] rounded border-black/20 accent-[#4f46e5]"
                    />
                  </td>
                  <td className="py-3.5 px-2 border-t border-black/[0.05] text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100">
                      <Link
                        to={`/admin/portfolios/${row.id}/edit`}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#71717a] hover:bg-[#4f46e5]/8 hover:text-[#4f46e5]"
                        title="수정"
                      >
                        <PencilIcon className="w-[18px] h-[18px]" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#71717a] hover:bg-[#dc2626]/8 hover:text-[#dc2626]"
                        title="삭제"
                      >
                        <TrashIcon className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
}
