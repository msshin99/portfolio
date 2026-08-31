import { useEffect, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { fetchAllSiteContent, upsertSiteContent, deleteSiteContent } from "../lib/adminApi";
import { refreshSiteContent, type SiteContentRow } from "../lib/siteContentApi";
import { CheckCircleIcon, HomeIcon, InfoIcon, PlusIcon, SparkleIcon, TrashIcon, UserIcon } from "./icons";
import { Button, Card, GroupHeading, Hint, Input, InfoBanner, Label, PageHeader, Textarea, TocNav } from "./ui";

/** 실제로 사이트에 연결된 전역 문구/이미지 키. Home.tsx/Hero.tsx, About.tsx가 이 key들을
 *  읽어서 값이 있으면 그걸, 없으면 코드에 있는 기본값을 그대로 보여준다. group은 아래
 *  화면에서 카드들을 사이트의 실제 섹션 단위로 묶어 보여주기 위한 표시용 값이다. */
const KNOWN_FIELDS: { key: string; label: string; type: "text" | "textarea" | "image"; hint: string; group: string }[] = [
  { key: "hero_heading", label: "큰 제목", hint: "홈 화면 맨 위에 크게 표시되는 문구입니다. 줄바꿈하면 두 줄로 나눠 표시됩니다.", type: "textarea", group: "home" },
  { key: "hero_subtext", label: "부제목", hint: "큰 제목 아래에 작게 표시되는 한 줄 설명입니다.", type: "text", group: "home" },
  { key: "hero_image", label: "배경 이미지", hint: "홈 화면 맨 위 히어로 영역의 배경 사진입니다.", type: "image", group: "home" },
  { key: "intro_heading", label: "소개 제목", hint: "홈 화면 히어로 아래, '(About)' 라벨과 함께 크게 표시되는 소개 문구입니다.", type: "textarea", group: "intro" },
  { key: "intro_description", label: "소개 설명글", hint: "소개 제목 아래에 작게 표시되는 설명 문단입니다.", type: "textarea", group: "intro" },
  { key: "service_description", label: "서비스 섹션 설명글", hint: "'My Service' 제목 아래에 표시되는 설명 문단입니다.", type: "textarea", group: "service" },
  { key: "about_description", label: "소개 페이지 글", hint: "About 페이지에 표시되는 자기소개 문단입니다.", type: "textarea", group: "about" },
  { key: "about_profile_image", label: "프로필 사진", hint: "About 페이지에 표시되는 프로필 사진입니다.", type: "image", group: "about" },
];

const GROUPS: { id: string; title: string; description: string; icon: typeof HomeIcon }[] = [
  { id: "home", title: "홈 화면 히어로", description: "사이트에 처음 들어왔을 때 맨 위에 보이는 화면", icon: HomeIcon },
  { id: "intro", title: "소개(Intro) 섹션", description: "히어로 아래 '(About)' 소개 영역 + 키워드 카드 4개", icon: InfoIcon },
  { id: "service", title: "서비스(Service) 섹션", description: "'My Service' 설명글 + 서비스 카드 3개", icon: SparkleIcon },
  { id: "about", title: "소개(About) 페이지", description: "별도 About 페이지", icon: UserIcon },
];

const SERVICE_SLOTS = [1, 2, 3];
const KEYWORD_SLOTS = [1, 2, 3, 4];

const TOC_ITEMS = [
  ...GROUPS.map((g) => ({ id: `group-${g.id}`, label: g.title.replace(/\s*\(.*?\)\s*/g, "") })),
  { id: "group-custom", label: "기타 항목" },
];

function KnownFieldEditor({
  field,
  row,
  onSaved,
}: {
  field: (typeof KNOWN_FIELDS)[number];
  row: SiteContentRow | undefined;
  onSaved: () => void;
}) {
  const [text, setText] = useState(row?.value_text ?? "");
  const [imageUrl, setImageUrl] = useState(row?.value_image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(row?.value_text ?? "");
    setImageUrl(row?.value_image_url ?? "");
  }, [row]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await upsertSiteContent({
        key: field.key,
        value_text: field.type === "image" ? null : text,
        value_image_url: field.type === "image" ? imageUrl : null,
      });
      refreshSiteContent();
      setSaved(true);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-[15px] font-semibold text-[#18181b]">{field.label}</h3>
      <p className="text-xs text-[#a1a1aa] mb-3">{field.hint}</p>

      {field.type === "image" ? (
        <ImageUploadField label="" slug="site-content" value={imageUrl} onChange={(url) => setImageUrl(url)} />
      ) : field.type === "textarea" ? (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      ) : (
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      )}

      <div className="flex items-center gap-3 mt-4">
        <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-[#16a34a]">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            저장됨
          </span>
        )}
      </div>
    </Card>
  );
}

/** 서비스 카드 하나(제목 2줄 + 이미지 + 설명)를 한 번에 저장한다. 3개 키(title/image/description)를
 *  묶어서 다루는 이유는 site_content가 단순 key-value라 이 3개를 따로 두면 첫 사용자에게
 *  "서비스 카드 1개"라는 단위가 잘 안 보이기 때문 — 카드 UI 자체로 그 단위를 표현한다. */
function ServiceCardEditor({
  index,
  rows,
  onSaved,
}: {
  index: number;
  rows: SiteContentRow[];
  onSaved: () => void;
}) {
  const titleKey = `service_${index}_title`;
  const imageKey = `service_${index}_image`;
  const descriptionKey = `service_${index}_description`;
  const titleRow = rows.find((r) => r.key === titleKey);
  const imageRow = rows.find((r) => r.key === imageKey);
  const descriptionRow = rows.find((r) => r.key === descriptionKey);

  const [titleLine1, setTitleLine1] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [imageUrl, setImageUrl] = useState(imageRow?.value_image_url ?? "");
  const [description, setDescription] = useState(descriptionRow?.value_text ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const [line1, line2] = (titleRow?.value_text ?? "").split("\n");
    setTitleLine1(line1 ?? "");
    setTitleLine2(line2 ?? "");
    setImageUrl(imageRow?.value_image_url ?? "");
    setDescription(descriptionRow?.value_text ?? "");
  }, [titleRow, imageRow, descriptionRow]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertSiteContent({ key: titleKey, value_text: [titleLine1, titleLine2].join("\n"), value_image_url: null }),
        upsertSiteContent({ key: imageKey, value_text: null, value_image_url: imageUrl }),
        upsertSiteContent({ key: descriptionKey, value_text: description, value_image_url: null }),
      ]);
      refreshSiteContent();
      setSaved(true);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 flex flex-col gap-4">
      <h3 className="text-[15px] font-semibold text-[#18181b]">서비스 카드 {index}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>제목 첫째 줄</Label>
          <Input value={titleLine1} onChange={(e) => setTitleLine1(e.target.value)} placeholder="예: Concept" />
        </div>
        <div>
          <Label>제목 둘째 줄</Label>
          <Input value={titleLine2} onChange={(e) => setTitleLine2(e.target.value)} placeholder="예: Strategy" />
        </div>
      </div>

      <div>
        <Label>카드 이미지</Label>
        <ImageUploadField label="" slug="site-content" value={imageUrl} onChange={setImageUrl} />
      </div>

      <div>
        <Label>설명</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-[#16a34a]">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            저장됨
          </span>
        )}
      </div>
    </Card>
  );
}

/** 키워드 카드 하나(한글 제목 + 영문 부제 + 아이콘 이미지)를 한 번에 저장한다. 카드 앞의
 *  "01." 같은 번호는 카드 위치로 자동 정해지는 표시용 라벨이라 편집 대상에서 뺀다. */
function KeywordCardEditor({
  index,
  rows,
  onSaved,
}: {
  index: number;
  rows: SiteContentRow[];
  onSaved: () => void;
}) {
  const titleKey = `keyword_${index}_title`;
  const subKey = `keyword_${index}_sub`;
  const imageKey = `keyword_${index}_image`;
  const titleRow = rows.find((r) => r.key === titleKey);
  const subRow = rows.find((r) => r.key === subKey);
  const imageRow = rows.find((r) => r.key === imageKey);

  const [title, setTitle] = useState("");
  const [sub, setSub] = useState("");
  const [imageUrl, setImageUrl] = useState(imageRow?.value_image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTitle(titleRow?.value_text ?? "");
    setSub(subRow?.value_text ?? "");
    setImageUrl(imageRow?.value_image_url ?? "");
  }, [titleRow, subRow, imageRow]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertSiteContent({ key: titleKey, value_text: title, value_image_url: null }),
        upsertSiteContent({ key: subKey, value_text: sub, value_image_url: null }),
        upsertSiteContent({ key: imageKey, value_text: null, value_image_url: imageUrl }),
      ]);
      refreshSiteContent();
      setSaved(true);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 flex flex-col gap-4">
      <h3 className="text-[15px] font-semibold text-[#18181b]">
        키워드 카드 {index} <span className="text-[#a1a1aa] font-normal">({String(index).padStart(2, "0")}.)</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>한글 제목</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 선동 동력" />
        </div>
        <div>
          <Label>영문 부제</Label>
          <Input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="예: Ability to Lead" />
        </div>
      </div>

      <div>
        <Label>아이콘 이미지</Label>
        <ImageUploadField label="" slug="site-content" value={imageUrl} onChange={setImageUrl} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-[#16a34a]">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            저장됨
          </span>
        )}
      </div>
    </Card>
  );
}

function CustomFieldRow({
  row,
  onSaved,
  onDeleted,
}: {
  row: SiteContentRow;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [text, setText] = useState(row.value_text ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertSiteContent({ key: row.key, value_text: text, value_image_url: row.value_image_url });
      refreshSiteContent();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`"${row.key}" 항목을 삭제하시겠습니까?`)) return;
    await deleteSiteContent(row.key);
    refreshSiteContent();
    onDeleted();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-36 shrink-0 text-sm text-[#71717a] truncate">{row.key}</span>
      <Input value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
      <Button type="button" variant="outline" size="sm" onClick={handleSave} disabled={saving}>
        저장
      </Button>
      <button
        type="button"
        onClick={handleDelete}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#a1a1aa] hover:bg-[#dc2626]/8 hover:text-[#dc2626] shrink-0"
        title="삭제"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminSiteContent() {
  const [rows, setRows] = useState<SiteContentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");

  async function load() {
    try {
      const data = await fetchAllSiteContent();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddCustom() {
    const key = newKey.trim();
    if (!key) return;
    if (rows?.some((r) => r.key === key)) {
      setError(`"${key}" 키가 이미 존재합니다.`);
      return;
    }
    await upsertSiteContent({ key, value_text: "", value_image_url: null });
    refreshSiteContent();
    setNewKey("");
    await load();
  }

  if (!rows) {
    return <div className="py-20 text-center text-sm text-[#a1a1aa]">불러오는 중...</div>;
  }

  const knownKeys = new Set([
    ...KNOWN_FIELDS.map((f) => f.key),
    ...SERVICE_SLOTS.flatMap((n) => [`service_${n}_title`, `service_${n}_image`, `service_${n}_description`]),
    ...KEYWORD_SLOTS.flatMap((n) => [`keyword_${n}_title`, `keyword_${n}_sub`, `keyword_${n}_image`]),
  ]);
  const customRows = rows.filter((r) => !knownKeys.has(r.key));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="사이트 전역 콘텐츠" description="홈 화면 각 섹션과 소개 페이지에 공통으로 쓰이는 문구·이미지를 관리합니다." />

      <InfoBanner title="이 페이지 사용법">
        항목을 <b>비워두면</b> 원래 기본 문구/이미지가 그대로 보이고, 값을 입력한 뒤 <b>저장</b>을 눌러야 실제 사이트에 반영됩니다.
        아래 카드는 사이트의 각 화면 영역과 같은 순서로 묶여 있습니다.
      </InfoBanner>

      <TocNav items={TOC_ITEMS} />

      {error && <div className="rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</div>}

      {GROUPS.map((group) => (
        <div key={group.id} id={`group-${group.id}`} className="flex flex-col gap-4 scroll-mt-20">
          <GroupHeading icon={<group.icon className="w-3.5 h-3.5" />} title={group.title} description={group.description} />
          {KNOWN_FIELDS.filter((f) => f.group === group.id).map((field) => (
            <KnownFieldEditor key={field.key} field={field} row={rows.find((r) => r.key === field.key)} onSaved={load} />
          ))}
          {group.id === "intro" &&
            KEYWORD_SLOTS.map((n) => <KeywordCardEditor key={n} index={n} rows={rows} onSaved={load} />)}
          {group.id === "service" &&
            SERVICE_SLOTS.map((n) => <ServiceCardEditor key={n} index={n} rows={rows} onSaved={load} />)}
        </div>
      ))}

      <div id="group-custom" className="flex flex-col gap-4 scroll-mt-20">
        <GroupHeading title="기타 항목" description="개발자용" />
        <Card className="p-6">
          <Hint>
            여기서 새 항목을 만들어도 코드에서 별도로 연결하기 전까지는 사이트 어디에도 표시되지 않습니다. 특별히
            안내받은 경우가 아니라면 사용하지 않아도 됩니다.
          </Hint>
          <div className="flex flex-col gap-2.5 mt-4">
            {customRows.map((row) => (
              <CustomFieldRow key={row.key} row={row} onSaved={load} onDeleted={load} />
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-black/[0.05]">
            <Input placeholder="새 key 이름" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={handleAddCustom} className="shrink-0">
              <PlusIcon className="w-3.5 h-3.5" />
              추가
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
