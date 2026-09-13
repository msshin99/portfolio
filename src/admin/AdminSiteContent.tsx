import { useEffect, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { fetchAllSiteContent, upsertSiteContent, deleteSiteContent } from "../lib/adminApi";
import { refreshSiteContent, type SiteContentRow } from "../lib/siteContentApi";
import { skillGroups } from "../data/skills";
import {
  CheckCircleIcon,
  HomeIcon,
  InfoIcon,
  MonitorIcon,
  PaletteIcon,
  PlusIcon,
  SparkleIcon,
  TrashIcon,
  UserIcon,
} from "./icons";
import { Button, Card, GroupHeading, Hint, Input, InfoBanner, Label, PageHeader, Select, Textarea, TocNav } from "./ui";

/** 실제로 사이트에 연결된 전역 문구/이미지 키. Home.tsx/Hero.tsx, About.tsx가 이 key들을
 *  읽어서 값이 있으면 그걸, 없으면 코드에 있는 기본값을 그대로 보여준다. group은 아래
 *  화면에서 카드들을 사이트의 실제 섹션 단위로 묶어 보여주기 위한 표시용 값이다. */
const KNOWN_FIELDS: { key: string; label: string; type: "text" | "textarea" | "image"; hint: string; group: string }[] = [
  { key: "hero_label", label: "좌상단 라벨", hint: "홈 화면 맨 위 왼쪽에 표시되는 짧은 문구입니다. 줄바꿈하면 두 줄로 나눠 표시됩니다.", type: "textarea", group: "home" },
  { key: "hero_tagline", label: "우상단 태그라인", hint: "홈 화면 맨 위 오른쪽에 표시되는 짧은 문구입니다. 줄바꿈하면 두 줄로 나눠 표시됩니다.", type: "textarea", group: "home" },
  { key: "hero_statement", label: "좌하단 큰 문구", hint: "홈 화면 하단 왼쪽에 크게 표시되는 문구입니다. 줄바꿈하면 두 줄로 나눠 표시됩니다.", type: "textarea", group: "home" },
  { key: "hero_bio", label: "우하단 소개(영문)", hint: "홈 화면 하단 오른쪽에 표시되는 짧은 소개 문단(영문)입니다. 한글 버전과 번갈아 표시됩니다.", type: "textarea", group: "home" },
  { key: "hero_bio_ko", label: "우하단 소개(한글)", hint: "위 영문 소개의 한글 버전입니다. 영문과 번갈아 표시됩니다.", type: "textarea", group: "home" },
  { key: "intro_heading", label: "소개 제목", hint: "홈 화면 히어로 아래, '(About)' 라벨과 함께 크게 표시되는 소개 문구입니다.", type: "textarea", group: "intro" },
  { key: "intro_description", label: "소개 설명글", hint: "소개 제목 아래에 작게 표시되는 설명 문단입니다.", type: "textarea", group: "intro" },
  { key: "works_subtxt", label: "작은 라벨", hint: "'My Works' 제목 위에 작게 표시되는 라벨입니다 (기본값: (Professional)).", type: "text", group: "works" },
  { key: "works_title", label: "큰 제목", hint: "포트폴리오 섹션의 큰 제목입니다 (기본값: My Works).", type: "text", group: "works" },
  { key: "works_description", label: "설명글", hint: "큰 제목 옆에 표시되는 설명 문단입니다.", type: "textarea", group: "works" },
  { key: "work_together_text", label: "큰 문구", hint: "포트폴리오 섹션 바로 아래, 스크롤하면 오른쪽에서 미끄러져 들어오는 큰 문구입니다 (기본값: Let's work together).", type: "text", group: "workTogether" },
  { key: "skills_subtxt", label: "작은 라벨", hint: "'Skills' 제목 위에 작게 표시되는 라벨입니다 (기본값: (Capabilities)).", type: "text", group: "skills" },
  { key: "skills_title", label: "큰 제목", hint: "기술 스택 섹션의 큰 제목입니다 (기본값: Skills).", type: "text", group: "skills" },
  { key: "about_heading", label: "큰 제목(한글)", hint: "About 페이지 맨 위에 크게 표시되는 문구입니다.", type: "textarea", group: "about" },
  { key: "about_heading_en", label: "큰 제목(영문, 마우스 올렸을 때)", hint: "위 큰 제목에 마우스를 올리면 대신 표시되는 영문 버전입니다.", type: "textarea", group: "about" },
  { key: "about_description", label: "소개 페이지 글", hint: "About 페이지에 표시되는 자기소개 문단입니다.", type: "textarea", group: "about" },
  { key: "about_profile_image", label: "프로필 사진", hint: "About 페이지에 표시되는 프로필 사진입니다.", type: "image", group: "about" },
  { key: "about_info_subtxt", label: "Info 섹션 작은 라벨", hint: "'Info' 제목 위에 작게 표시되는 라벨입니다 (기본값: (Profile)).", type: "text", group: "about" },
  { key: "about_info_title", label: "Info 섹션 큰 제목", hint: "이력 아코디언 섹션의 큰 제목입니다 (기본값: Info).", type: "text", group: "about" },
  { key: "about_info_description", label: "Info 섹션 설명", hint: "Info 제목 옆에 표시되는 안내 문구입니다.", type: "text", group: "about" },
  {
    key: "hero_diagram_heading",
    label: "다이어그램 제목",
    hint: "My Works 아래 다이어그램 섹션 맨 위 큰 제목입니다. 줄바꿈하면 두 줄로 나눠 표시됩니다.",
    type: "textarea",
    group: "heroDiagram",
  },
  {
    key: "hero_diagram_subtext",
    label: "다이어그램 설명글",
    hint: "다이어그램 제목 아래에 표시되는 설명 문단입니다.",
    type: "textarea",
    group: "heroDiagram",
  },
  {
    key: "hero_diagram_center_label",
    label: "중앙 박스 이름",
    hint: "다이어그램 가운데 양쪽 사각형 박스 아래에 표시되는 이름입니다 (기본값: Lucien).",
    type: "text",
    group: "heroDiagram",
  },
  {
    key: "hero_diagram_llm_label",
    label: "중앙 그룹 이름",
    hint: "다이어그램 정중앙 3개 아이콘 그룹 아래에 표시되는 이름입니다 (기본값: LLMs).",
    type: "text",
    group: "heroDiagram",
  },
];

const GROUPS: { id: string; title: string; description: string; icon: typeof HomeIcon }[] = [
  { id: "home", title: "홈 화면 히어로", description: "사이트에 처음 들어왔을 때 맨 위에 보이는 화면", icon: HomeIcon },
  { id: "intro", title: "소개(Intro) 섹션", description: "히어로 아래 '(About)' 소개 영역 + 키워드 카드 4개", icon: InfoIcon },
  { id: "works", title: "My Works 섹션", description: "포트폴리오 목록 위에 표시되는 제목/설명글", icon: SparkleIcon },
  { id: "workTogether", title: "Let's work together 문구", description: "My Works 섹션 바로 아래 큰 문구", icon: SparkleIcon },
  { id: "service", title: "서비스 라인업 섹션", description: "'Let's work together' 아래, 마우스를 올리면 반복 문구가 흐르는 서비스 목록 4개", icon: SparkleIcon },
  {
    id: "heroDiagram",
    title: "Lucien 다이어그램 섹션",
    description: "My Works 아래 좌우 pill 8개 + 하단 카드 3개",
    icon: MonitorIcon,
  },
  { id: "skills", title: "Skills 섹션", description: "제목/라벨 + 기술 아이콘 8개", icon: PaletteIcon },
  { id: "about", title: "소개(About) 페이지", description: "별도 About 페이지", icon: UserIcon },
];

const CLIENT_ROW_SLOTS = [1, 2, 3, 4];
const KEYWORD_SLOTS = [1, 2, 3, 4];
/** data/skills.ts의 실제 아이콘 key 목록 — 여기서 새 아이콘을 추가/삭제하면
 *  자동으로 이 관리 화면에도 그만큼 카드가 늘거나 준다. */
const SKILL_ICON_SLOTS = skillGroups.flat().map((s) => s.key);
const HERO_PILL_SIDES = [
  { value: "left", label: "왼쪽" },
  { value: "right", label: "오른쪽" },
] as const;
const HERO_PILL_SLOTS = [1, 2, 3, 4];
const HERO_FEATURE_SLOTS = [1, 2, 3];

/** HeroDiagram.tsx의 PILL_ICON_KEYS/FEATURE_ICON_KEYS와 항상 같은 key 집합을 유지해야
 *  한다 — 여기서 고른 문자열이 그대로 site_content에 저장되고, Home.tsx가 그 문자열을
 *  PillIconKey/FeatureIconKey로 검증해서 쓴다. */
const HERO_PILL_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "input", label: "Input (커서)" },
  { value: "code", label: "Code (코드 태그)" },
  { value: "language", label: "Language (번역)" },
  { value: "agents", label: "Agents (사람 여러 명)" },
  { value: "datasets", label: "Datasets (데이터베이스)" },
  { value: "assessments", label: "Assessments (클립보드)" },
  { value: "api", label: "API (중괄호)" },
];
const HERO_FEATURE_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "cost", label: "Cost ($)" },
  { value: "certainty", label: "Certainty (시그마)" },
  { value: "performance", label: "Performance (계기판)" },
];

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

/** 서비스 라인업 한 행(카테고리/이름/연도 + hover 시 반복되는 문구 2개 + 대표
 *  이미지)을 한 번에 저장한다. 6개 키를 묶어서 다루는 이유는 site_content가 단순
 *  key-value라 이 6개를 따로 두면 "행 1개"라는 단위가 잘 안 보이기 때문 — 카드
 *  UI 자체로 그 단위를 표현한다. */
function ClientRowEditor({
  index,
  rows,
  onSaved,
}: {
  index: number;
  rows: SiteContentRow[];
  onSaved: () => void;
}) {
  const categoryKey = `client_row_${index}_category`;
  const titleKey = `client_row_${index}_title`;
  const metaKey = `client_row_${index}_meta`;
  const marquee1Key = `client_row_${index}_marquee1`;
  const marquee2Key = `client_row_${index}_marquee2`;
  const imageKey = `client_row_${index}_image`;
  const categoryRow = rows.find((r) => r.key === categoryKey);
  const titleRow = rows.find((r) => r.key === titleKey);
  const metaRow = rows.find((r) => r.key === metaKey);
  const marquee1Row = rows.find((r) => r.key === marquee1Key);
  const marquee2Row = rows.find((r) => r.key === marquee2Key);
  const imageRow = rows.find((r) => r.key === imageKey);

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [marquee1, setMarquee1] = useState("");
  const [marquee2, setMarquee2] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCategory(categoryRow?.value_text ?? "");
    setTitle(titleRow?.value_text ?? "");
    setMeta(metaRow?.value_text ?? "");
    setMarquee1(marquee1Row?.value_text ?? "");
    setMarquee2(marquee2Row?.value_text ?? "");
    setImageUrl(imageRow?.value_image_url ?? "");
  }, [categoryRow, titleRow, metaRow, marquee1Row, marquee2Row, imageRow]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertSiteContent({ key: categoryKey, value_text: category, value_image_url: null }),
        upsertSiteContent({ key: titleKey, value_text: title, value_image_url: null }),
        upsertSiteContent({ key: metaKey, value_text: meta, value_image_url: null }),
        upsertSiteContent({ key: marquee1Key, value_text: marquee1, value_image_url: null }),
        upsertSiteContent({ key: marquee2Key, value_text: marquee2, value_image_url: null }),
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
      <h3 className="text-[15px] font-semibold text-[#18181b]">서비스 항목 {index}</h3>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>카테고리(왼쪽 작은 텍스트)</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="예: Visual Production" />
        </div>
        <div>
          <Label>이름(가운데 큰 텍스트)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: AI Visual" />
        </div>
        <div>
          <Label>연도(오른쪽 작은 텍스트)</Label>
          <Input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="예: (25)" />
        </div>
      </div>

      <div>
        <Label>대표 이미지</Label>
        <ImageUploadField label="" slug="site-content" value={imageUrl} onChange={setImageUrl} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>hover 시 흐르는 문구 1</Label>
          <Input value={marquee1} onChange={(e) => setMarquee1(e.target.value)} placeholder="예: AI Visual" />
        </div>
        <div>
          <Label>hover 시 흐르는 문구 2</Label>
          <Input value={marquee2} onChange={(e) => setMarquee2(e.target.value)} placeholder="예: No Shoot Needed" />
        </div>
      </div>
      <Hint>마우스를 올리면 두 문구가 번갈아 반복되며 흐릅니다.</Hint>

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

/** 기술 아이콘 하나(기본 이미지 + 호버 시 이미지)를 한 번에 저장한다. */
function SkillIconEditor({
  slotKey,
  rows,
  onSaved,
}: {
  slotKey: string;
  rows: SiteContentRow[];
  onSaved: () => void;
}) {
  const imageKey = `skill_${slotKey}_image`;
  const hoverKey = `skill_${slotKey}_hover_image`;
  const imageRow = rows.find((r) => r.key === imageKey);
  const hoverRow = rows.find((r) => r.key === hoverKey);

  const [imageUrl, setImageUrl] = useState(imageRow?.value_image_url ?? "");
  const [hoverUrl, setHoverUrl] = useState(hoverRow?.value_image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setImageUrl(imageRow?.value_image_url ?? "");
    setHoverUrl(hoverRow?.value_image_url ?? "");
  }, [imageRow, hoverRow]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertSiteContent({ key: imageKey, value_text: null, value_image_url: imageUrl }),
        upsertSiteContent({ key: hoverKey, value_text: null, value_image_url: hoverUrl }),
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
      <h3 className="text-[15px] font-semibold text-[#18181b] capitalize">{slotKey} 아이콘</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>기본 아이콘</Label>
          <ImageUploadField label="" slug="site-content" value={imageUrl} onChange={setImageUrl} />
        </div>
        <div>
          <Label>호버 시 아이콘</Label>
          <ImageUploadField label="" slug="site-content" value={hoverUrl} onChange={setHoverUrl} />
        </div>
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

/** Lucien 다이어그램 좌/우 pill 하나(아이콘 + 라벨)를 한 번에 저장한다. */
function HeroPillEditor({
  side,
  index,
  rows,
  onSaved,
}: {
  side: "left" | "right";
  index: number;
  rows: SiteContentRow[];
  onSaved: () => void;
}) {
  const labelKey = `hero_pill_${side}_${index}_label`;
  const iconKey = `hero_pill_${side}_${index}_icon`;
  const labelRow = rows.find((r) => r.key === labelKey);
  const iconRow = rows.find((r) => r.key === iconKey);

  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLabel(labelRow?.value_text ?? "");
    setIcon(iconRow?.value_text ?? "");
  }, [labelRow, iconRow]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertSiteContent({ key: labelKey, value_text: label, value_image_url: null }),
        upsertSiteContent({ key: iconKey, value_text: icon, value_image_url: null }),
      ]);
      refreshSiteContent();
      setSaved(true);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const sideLabel = side === "left" ? "왼쪽" : "오른쪽";

  return (
    <Card className="p-6 flex flex-col gap-4">
      <h3 className="text-[15px] font-semibold text-[#18181b]">
        {sideLabel} pill {index}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>텍스트</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: Input" />
        </div>
        <div>
          <Label>아이콘</Label>
          <Select value={icon} onChange={(e) => setIcon(e.target.value)}>
            <option value="">(기본값 사용)</option>
            {HERO_PILL_ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
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

/** Lucien 다이어그램 하단 카드 하나(아이콘 + 2줄 제목 + 본문)를 한 번에 저장한다. */
function HeroFeatureEditor({
  index,
  rows,
  onSaved,
}: {
  index: number;
  rows: SiteContentRow[];
  onSaved: () => void;
}) {
  const heading1Key = `hero_feature_${index}_heading1`;
  const heading2Key = `hero_feature_${index}_heading2`;
  const bodyKey = `hero_feature_${index}_body`;
  const iconKey = `hero_feature_${index}_icon`;
  const heading1Row = rows.find((r) => r.key === heading1Key);
  const heading2Row = rows.find((r) => r.key === heading2Key);
  const bodyRow = rows.find((r) => r.key === bodyKey);
  const iconRow = rows.find((r) => r.key === iconKey);

  const [heading1, setHeading1] = useState("");
  const [heading2, setHeading2] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHeading1(heading1Row?.value_text ?? "");
    setHeading2(heading2Row?.value_text ?? "");
    setBody(bodyRow?.value_text ?? "");
    setIcon(iconRow?.value_text ?? "");
  }, [heading1Row, heading2Row, bodyRow, iconRow]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertSiteContent({ key: heading1Key, value_text: heading1, value_image_url: null }),
        upsertSiteContent({ key: heading2Key, value_text: heading2, value_image_url: null }),
        upsertSiteContent({ key: bodyKey, value_text: body, value_image_url: null }),
        upsertSiteContent({ key: iconKey, value_text: icon, value_image_url: null }),
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
      <h3 className="text-[15px] font-semibold text-[#18181b]">하단 카드 {index}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>제목 첫째 줄</Label>
          <Input value={heading1} onChange={(e) => setHeading1(e.target.value)} placeholder="예: Lower cost than token-" />
        </div>
        <div>
          <Label>제목 둘째 줄</Label>
          <Input value={heading2} onChange={(e) => setHeading2(e.target.value)} placeholder="예: based tools" />
        </div>
      </div>

      <div>
        <Label>아이콘</Label>
        <Select value={icon} onChange={(e) => setIcon(e.target.value)}>
          <option value="">(기본값 사용)</option>
          {HERO_FEATURE_ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>본문</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
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
    ...CLIENT_ROW_SLOTS.flatMap((n) => [
      `client_row_${n}_category`,
      `client_row_${n}_title`,
      `client_row_${n}_meta`,
      `client_row_${n}_marquee1`,
      `client_row_${n}_marquee2`,
      `client_row_${n}_image`,
    ]),
    ...KEYWORD_SLOTS.flatMap((n) => [`keyword_${n}_title`, `keyword_${n}_sub`, `keyword_${n}_image`]),
    ...SKILL_ICON_SLOTS.flatMap((key) => [`skill_${key}_image`, `skill_${key}_hover_image`]),
    ...HERO_PILL_SIDES.flatMap(({ value: side }) =>
      HERO_PILL_SLOTS.flatMap((n) => [`hero_pill_${side}_${n}_label`, `hero_pill_${side}_${n}_icon`])
    ),
    ...HERO_FEATURE_SLOTS.flatMap((n) => [
      `hero_feature_${n}_heading1`,
      `hero_feature_${n}_heading2`,
      `hero_feature_${n}_body`,
      `hero_feature_${n}_icon`,
    ]),
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
            CLIENT_ROW_SLOTS.map((n) => <ClientRowEditor key={n} index={n} rows={rows} onSaved={load} />)}
          {group.id === "skills" &&
            SKILL_ICON_SLOTS.map((key) => <SkillIconEditor key={key} slotKey={key} rows={rows} onSaved={load} />)}
          {group.id === "heroDiagram" && (
            <>
              {HERO_PILL_SIDES.map((side) =>
                HERO_PILL_SLOTS.map((n) => (
                  <HeroPillEditor key={`${side.value}-${n}`} side={side.value} index={n} rows={rows} onSaved={load} />
                ))
              )}
              {HERO_FEATURE_SLOTS.map((n) => (
                <HeroFeatureEditor key={n} index={n} rows={rows} onSaved={load} />
              ))}
            </>
          )}
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
