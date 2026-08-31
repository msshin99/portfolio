import { useEffect, useState } from "react";
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
import ImageUploadField from "./ImageUploadField";
import {
  fetchAllGraphicWorks,
  createGraphicWork,
  updateGraphicWork,
  deleteGraphicWork,
  reorderGraphicWorks,
} from "../lib/adminApi";
import { refreshGraphicWorks, type GraphicWorkRow } from "../lib/graphicWorksApi";
import { AlertIcon, ExternalLinkIcon, GripIcon, PaletteIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "./icons";
import { Button, Card, EmptyState, InfoBanner, Input, Label, PageHeader } from "./ui";

type FormState = {
  title: string;
  date_label: string;
  caption: string;
  image_url: string;
  href: string;
};

const emptyForm = (): FormState => ({ title: "", date_label: "", caption: "", image_url: "", href: "" });

function rowToForm(row: GraphicWorkRow): FormState {
  return { title: row.title, date_label: row.date_label, caption: row.caption, image_url: row.image_url, href: row.href };
}

function SortableRow({
  row,
  index,
  onEdit,
  onDelete,
}: {
  row: GraphicWorkRow;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

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
      <img src={row.image_url} alt="" className="w-20 h-14 object-cover rounded-md bg-[#f0f0f5]" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-[#18181b] truncate">{row.title}</p>
        <p className="text-xs text-[#a1a1aa] truncate">
          {row.date_label} · {row.caption}
        </p>
      </div>
      <a
        href={row.href}
        target="_blank"
        rel="noreferrer"
        className="text-[#c4c4cc] hover:text-[#4f46e5] shrink-0"
        title={row.href}
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#71717a] hover:bg-[#4f46e5]/8 hover:text-[#4f46e5]"
          title="수정"
        >
          <PencilIcon className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#71717a] hover:bg-[#dc2626]/8 hover:text-[#dc2626]"
          title="삭제"
        >
          <TrashIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
    </li>
  );
}

export default function AdminGraphicWorks() {
  const [rows, setRows] = useState<GraphicWorkRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function load() {
    try {
      const data = await fetchAllGraphicWorks();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startAdd() {
    setForm(emptyForm());
    setEditingId("new");
  }

  function startEdit(row: GraphicWorkRow) {
    setForm(rowToForm(row));
    setEditingId(row.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    if (!form.title.trim() || !form.image_url || !form.href.trim()) {
      setError("제목, 이미지, 링크는 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") {
        await createGraphicWork({ ...form, display_order: rows?.length ?? 0 });
      } else if (editingId) {
        await updateGraphicWork(editingId, { ...form, display_order: rows?.find((r) => r.id === editingId)?.display_order ?? 0 });
      }
      refreshGraphicWorks();
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: GraphicWorkRow) {
    if (!confirm(`"${row.title}"을(를) 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    try {
      await deleteGraphicWork(row.id);
      refreshGraphicWorks();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!rows) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    const reordered = arrayMove(rows, oldIndex, newIndex);
    setRows(reordered);
    try {
      await reorderGraphicWorks(reordered.map((r) => r.id));
      refreshGraphicWorks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "순서 저장에 실패했습니다.");
      await load();
    }
  }

  if (!rows) {
    return <div className="py-20 text-center text-sm text-[#a1a1aa]">불러오는 중...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="그래픽 디자인"
        description="포트폴리오 리스트의 GRAPIC DESIGN 그룹에 노출되는 카드를 등록·수정·삭제하고 순서를 정리합니다."
        action={
          <Button type="button" variant="primary" onClick={startAdd}>
            <PlusIcon className="w-4 h-4" />
            새 항목 추가
          </Button>
        }
      />

      <InfoBanner title="이 페이지 사용법">
        썸네일 이미지·제목·날짜 문구·설명·링크를 등록하면 포트폴리오 리스트 페이지의 <b>GRAPIC DESIGN</b> 그룹에 그대로
        노출됩니다. 링크는 <b>/portfolio/chairpdp</b>처럼 사이트 내부 경로여도, Behance 등 외부 URL이어도 됩니다.
        카드를 드래그하면 노출 순서가 바로 저장됩니다.
      </InfoBanner>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
          <AlertIcon className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {editingId && (
        <Card className="p-6 flex flex-col gap-4 border-[#4f46e5]/30">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#18181b]">
              {editingId === "new" ? "새 항목 추가" : "항목 수정"}
            </h3>
            <button type="button" onClick={cancelEdit} className="text-[#a1a1aa] hover:text-[#71717a]">
              <XIcon className="w-[18px] h-[18px]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>제목</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="예: Memory in frame" />
            </div>
            <div>
              <Label>날짜 문구</Label>
              <Input value={form.date_label} onChange={(e) => setForm((p) => ({ ...p, date_label: e.target.value }))} placeholder="예: 2025.10" />
            </div>
          </div>

          <div>
            <Label>설명</Label>
            <Input value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} placeholder="예: Logo design" />
          </div>

          <div>
            <Label>링크 (내부 경로 또는 외부 URL)</Label>
            <Input
              value={form.href}
              onChange={(e) => setForm((p) => ({ ...p, href: e.target.value }))}
              placeholder="예: /portfolio/chairpdp 또는 https://www.behance.net/..."
            />
          </div>

          <div>
            <Label>썸네일 이미지</Label>
            <ImageUploadField label="" slug="graphic-works" value={form.image_url} onChange={(url) => setForm((p) => ({ ...p, image_url: url }))} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEdit}>
              취소
            </Button>
          </div>
        </Card>
      )}

      {rows.length === 0 && !editingId ? (
        <EmptyState
          icon={<PaletteIcon className="w-8 h-8" />}
          title="등록된 그래픽 디자인 항목이 없습니다"
          description="위 '새 항목 추가' 버튼을 눌러 첫 항목을 등록해보세요."
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {rows.map((row, i) => (
                <SortableRow key={row.id} row={row} index={i} onEdit={() => startEdit(row)} onDelete={() => handleDelete(row)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
