import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ImageUploadField from "./ImageUploadField";
import {
  slugify,
  fetchPortfolioById,
  createPortfolio,
  updatePortfolio,
  assembleContentBlocks,
  type PortfolioInput,
} from "../lib/adminApi";
import { refreshPortfolios, type ContentBlock } from "../lib/portfolioApi";
import { AlertIcon, DocumentIcon, ImagePlaceholderIcon, InfoIcon, ListIcon, MonitorIcon, PaletteIcon, PlusIcon, TrashIcon, TypeIcon, XIcon } from "./icons";
import { Button, Card, Hint, Input, Label, PageHeader, SectionTitle, Textarea, TocNav } from "./ui";

const TOC_ITEMS = [
  { id: "section-basic", label: "기본 정보" },
  { id: "section-description", label: "본문 설명" },
  { id: "section-meta", label: "메타 정보" },
  { id: "section-box", label: "화면 미리보기" },
  { id: "section-font", label: "폰트 가이드" },
  { id: "section-color", label: "컬러 팔레트" },
  { id: "section-main-image", label: "쇼케이스 이미지" },
];

type BoxContainer = Extract<ContentBlock, { type: "box_container" }>;
type FontInfo = Extract<ContentBlock, { type: "font_info" }>;
type ColorInfo = Extract<ContentBlock, { type: "color_info" }>;
type MainImageBlock = Extract<ContentBlock, { type: "main_image" }>;

const emptyBoxContainer = (): BoxContainer => ({
  type: "box_container",
  sub1_image_url: "",
  sub2_image_url: "",
  device_slides: [],
});
const emptyFontInfo = (): FontInfo => ({
  type: "font_info",
  image_url: "",
  image_mobile_url: "",
  tight: false,
  guides: [],
});
const emptyColorInfo = (): ColorInfo => ({ type: "color_info", description: "", cards: [] });
const emptyMainImage = (): MainImageBlock => ({ type: "main_image", main_image_url: "" });

/** <input type="color">는 반드시 6자리 hex(#rrggbb) 값만 받는다 — card.background/text_color에
 *  아직 유효하지 않은 값(입력 중이거나 비어있는 경우)이 들어있어도 색상 선택기 자체는 깨지지
 *  않도록, 유효하지 않으면 대체값으로 보여준다. */
function toColorInputValue(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

/** 콤마로 구분해서 한 input에 몰아넣던 값(sizes/tags처럼 공개 사이트에서는 각각 따로
 *  렌더링되는 값들)을, 하나씩 추가·수정·삭제할 수 있는 칩 목록으로 관리한다. */
function ChipListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((value, i) => (
        <div key={i} className="flex items-center gap-1 rounded-md border border-black/10 bg-white py-1 pl-2.5 pr-1.5">
          <input
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((v, idx) => (idx === i ? e.target.value : v)))}
            className="w-16 bg-transparent text-sm text-[#18181b] outline-none"
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="flex h-4 w-4 items-center justify-center rounded-full text-[#a1a1aa] hover:bg-[#dc2626]/10 hover:text-[#dc2626]"
            title="삭제"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="flex h-8 items-center gap-1 rounded-md border border-dashed border-black/15 px-2.5 text-xs text-[#71717a] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]"
      >
        <PlusIcon className="w-3 h-3" />
        추가
      </button>
    </div>
  );
}

function RemoveButton({ onClick, children = "삭제" }: { onClick: () => void; children?: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-[#dc2626] hover:text-[#b91c1c]">
      <TrashIcon className="w-3.5 h-3.5" />
      {children}
    </button>
  );
}

export default function AdminPortfolioForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [featuredState, setFeaturedState] = useState<{ is_featured_on_main: boolean; main_display_order: number | null }>({
    is_featured_on_main: false,
    main_display_order: null,
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [listCaption, setListCaption] = useState("");
  const [listDateLabel, setListDateLabel] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [description, setDescription] = useState<string[]>([""]);
  const [meta, setMeta] = useState<{ label: string; value: string; note: string }[]>([]);
  const [boxContainer, setBoxContainer] = useState<BoxContainer>(emptyBoxContainer());
  const [fontInfoBlocks, setFontInfoBlocks] = useState<FontInfo[]>([emptyFontInfo()]);
  const [colorInfo, setColorInfo] = useState<ColorInfo>(emptyColorInfo());
  const [mainImage, setMainImage] = useState<MainImageBlock>(emptyMainImage());

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const row = await fetchPortfolioById(id);
        if (!row) {
          setError("포트폴리오를 찾을 수 없습니다.");
          return;
        }
        setTitle(row.title);
        setSlug(row.slug);
        setListCaption(row.list_caption);
        setListDateLabel(row.list_date_label);
        setSubtitle(row.subtitle);
        setWebsiteUrl(row.website_url ?? "");
        setHeroImageUrl(row.hero_image_url ?? "");
        setDescription(row.description.length ? row.description : [""]);
        setMeta(row.meta.map((m) => ({ label: m.label, value: m.value, note: m.note ?? "" })));
        setFeaturedState({ is_featured_on_main: row.is_featured_on_main, main_display_order: row.main_display_order });

        const bc = row.content_blocks.find((b): b is BoxContainer => b.type === "box_container");
        if (bc) setBoxContainer(bc);
        const fonts = row.content_blocks.filter((b): b is FontInfo => b.type === "font_info");
        if (fonts.length) setFontInfoBlocks(fonts);
        const ci = row.content_blocks.find((b): b is ColorInfo => b.type === "color_info");
        if (ci) setColorInfo(ci);
        const mi = row.content_blocks.find((b): b is MainImageBlock => b.type === "main_image");
        if (mi) setMainImage(mi);
      } catch (err) {
        setError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input: PortfolioInput = {
        slug,
        title,
        list_caption: listCaption,
        list_date_label: listDateLabel,
        subtitle,
        description: description.map((p) => p.trim()).filter((p) => p !== ""),
        meta: meta
          .filter((m) => m.label.trim() || m.value.trim())
          .map((m) => ({ label: m.label, value: m.value, ...(m.note ? { note: m.note } : {}) })),
        website_url: websiteUrl || null,
        hero_image_url: heroImageUrl || null,
        content_blocks: assembleContentBlocks({ boxContainer, fontInfoBlocks, colorInfo, mainImage }),
        is_featured_on_main: featuredState.is_featured_on_main,
        main_display_order: featuredState.main_display_order,
      };

      if (isEdit && id) {
        await updatePortfolio(id, input);
      } else {
        await createPortfolio(input);
      }
      refreshPortfolios();
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다. slug가 중복되지 않았는지 확인해주세요.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-[#a1a1aa]">불러오는 중...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-4">
      <PageHeader
        title={isEdit ? "포트폴리오 수정" : "새 포트폴리오 등록"}
        action={
          <Link to="/admin" className="text-sm text-[#71717a] hover:text-[#18181b]">
            ← 목록으로
          </Link>
        }
      />

      <TocNav items={TOC_ITEMS} />

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
          <AlertIcon className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <Card id="section-basic" className="p-8 flex flex-col gap-5 scroll-mt-20">
        <SectionTitle
          icon={<InfoIcon className="w-[18px] h-[18px]" />}
          title="기본 정보"
          description="포트폴리오 목록과 상세페이지 상단에 공통으로 쓰이는 정보입니다."
        />

        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label>제목</Label>
            <Input required value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="예: Nordune" />
            <Hint>목록·상세페이지에 표시될 프로젝트 이름입니다.</Hint>
          </div>
          <div>
            <Label>URL 주소 (슬러그)</Label>
            <Input
              required
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
            />
            <Hint>
              제목을 입력하면 자동으로 채워집니다. 사이트 주소 끝부분에 쓰여요: /portfolio/<b className="text-[#71717a]">{slug || "예시"}</b>
            </Hint>
          </div>
          <div>
            <Label>목록 카드 소개 문구</Label>
            <Input value={listCaption} onChange={(e) => setListCaption(e.target.value)} placeholder="예: 가구 온라인 이커머스 플랫폼" />
            <Hint>포트폴리오 목록 페이지에서 카드 안에 짧게 표시되는 한 줄 설명입니다.</Hint>
          </div>
          <div>
            <Label>목록 카드 날짜 문구</Label>
            <Input value={listDateLabel} onChange={(e) => setListDateLabel(e.target.value)} placeholder="예: 2025.05" />
            <Hint>목록 카드에 함께 표시되는 날짜/기간 텍스트입니다.</Hint>
          </div>
          <div className="col-span-2">
            <Label>상세페이지 소제목</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="예: 단순한 제품 소개를 넘어, 브랜드가 지향하는 삶의 방식" />
            <Hint>상세페이지 맨 위, 제목 아래에 크게 표시되는 한 줄 카피입니다.</Hint>
          </div>
          <div className="col-span-2">
            <Label>웹사이트 URL (선택)</Label>
            <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
            <Hint>실제로 배포된 사이트가 있다면 입력하세요. 없으면 비워둬도 됩니다.</Hint>
          </div>
        </div>

        <div>
          <Label>대표 이미지</Label>
          <ImageUploadField label="" slug={slug} value={heroImageUrl} onChange={setHeroImageUrl} />
          <Hint>목록의 썸네일과 상세페이지 맨 위 큰 이미지에 동일하게 사용됩니다.</Hint>
        </div>
      </Card>

      {/* 본문 설명 */}
      <Card id="section-description" className="p-8 flex flex-col gap-4 scroll-mt-20">
        <SectionTitle
          icon={<DocumentIcon className="w-[18px] h-[18px]" />}
          title="본문 설명 (문단)"
          description="상세페이지 소제목 아래에 순서대로 나열되는 설명 문단입니다. 문단을 나눠서 여러 개 추가할 수 있습니다."
        />
        {description.map((p, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Textarea
              value={p}
              onChange={(e) => setDescription((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
              rows={3}
              className="flex-1"
            />
            <RemoveButton onClick={() => setDescription((prev) => prev.filter((_, idx) => idx !== i))} />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setDescription((prev) => [...prev, ""])}>
          <PlusIcon className="w-3.5 h-3.5" />
          문단 추가
        </Button>
      </Card>

      {/* 메타 정보 */}
      <Card id="section-meta" className="p-8 flex flex-col gap-4 scroll-mt-20">
        <SectionTitle
          icon={<ListIcon className="w-[18px] h-[18px]" />}
          title="메타 정보"
          description='상세페이지에 "역할 / 기간 / 사용 도구"처럼 표로 정리해서 보여주는 프로젝트 정보입니다. 이름-내용 한 쌍이 한 행입니다.'
        />
        {meta.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
            <Input
              placeholder="항목명 (예: Role)"
              value={row.label}
              onChange={(e) => setMeta((prev) => prev.map((m, idx) => (idx === i ? { ...m, label: e.target.value } : m)))}
            />
            <Input
              placeholder="내용 (예: Frontend Developer)"
              value={row.value}
              onChange={(e) => setMeta((prev) => prev.map((m, idx) => (idx === i ? { ...m, value: e.target.value } : m)))}
            />
            <Input
              placeholder="보충 설명 (선택)"
              value={row.note}
              onChange={(e) => setMeta((prev) => prev.map((m, idx) => (idx === i ? { ...m, note: e.target.value } : m)))}
            />
            <RemoveButton onClick={() => setMeta((prev) => prev.filter((_, idx) => idx !== i))} />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setMeta((prev) => [...prev, { label: "", value: "", note: "" }])}>
          <PlusIcon className="w-3.5 h-3.5" />
          행 추가
        </Button>
      </Card>

      {/* Box Container */}
      <Card id="section-box" className="p-8 flex flex-col gap-5 scroll-mt-20">
        <SectionTitle
          icon={<MonitorIcon className="w-[18px] h-[18px]" />}
          title="웹/모바일 화면 미리보기"
          description="상세페이지 중간에 나란히 배치되는 두 개의 화면 예시 이미지와, 기기별 화면을 넘겨볼 수 있는 슬라이드입니다."
        />
        <div className="grid grid-cols-2 gap-5">
          <ImageUploadField
            label="이미지 1"
            slug={slug}
            value={boxContainer.sub1_image_url}
            onChange={(url) => setBoxContainer((prev) => ({ ...prev, sub1_image_url: url }))}
          />
          <ImageUploadField
            label="이미지 2"
            slug={slug}
            value={boxContainer.sub2_image_url}
            onChange={(url) => setBoxContainer((prev) => ({ ...prev, sub2_image_url: url }))}
          />
        </div>
        <div className="pt-2 border-t border-black/[0.05]">
          <h3 className="text-[15px] font-medium text-[#3f3f46]">디바이스 스와이프 슬라이드</h3>
          <Hint>PC/태블릿/모바일처럼 기기별 화면을 좌우로 넘겨보는 슬라이드입니다. 라벨은 슬라이드 아래 표시되는 이름이에요.</Hint>
        </div>
        {boxContainer.device_slides.map((slide, i) => (
          <div key={i} className="flex gap-3 items-end pb-3 border-b border-black/[0.05] last:border-0">
            <div className="w-40">
              <Label>라벨</Label>
              <Input placeholder="예: Mobile"
                value={slide.label}
                onChange={(e) =>
                  setBoxContainer((prev) => ({
                    ...prev,
                    device_slides: prev.device_slides.map((s, idx) => (idx === i ? { ...s, label: e.target.value } : s)),
                  }))
                }
              />
            </div>
            <ImageUploadField
              label="이미지"
              slug={slug}
              value={slide.image_url}
              onChange={(url) =>
                setBoxContainer((prev) => ({
                  ...prev,
                  device_slides: prev.device_slides.map((s, idx) => (idx === i ? { ...s, image_url: url } : s)),
                }))
              }
            />
            <RemoveButton
              onClick={() =>
                setBoxContainer((prev) => ({ ...prev, device_slides: prev.device_slides.filter((_, idx) => idx !== i) }))
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setBoxContainer((prev) => ({ ...prev, device_slides: [...prev.device_slides, { label: "", image_url: "" }] }))
          }
        >
          <PlusIcon className="w-3.5 h-3.5" />
          슬라이드 추가
        </Button>
      </Card>

      {/* Font Info blocks */}
      <Card id="section-font" className="p-8 flex flex-col gap-5 scroll-mt-20">
        <SectionTitle
          icon={<TypeIcon className="w-[18px] h-[18px]" />}
          title="폰트 스타일 가이드"
          description="프로젝트에서 사용한 폰트 스타일을 소개하는 섹션입니다. 보통 블록 1개면 충분하고, 필요하면 PC용/모바일용처럼 블록을 더 추가할 수 있습니다."
        />
        {fontInfoBlocks.map((block, blockIndex) => (
          <div key={blockIndex} className="rounded-xl bg-[#f9f9fb] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[#18181b]">블록 {blockIndex + 1}</span>
              <RemoveButton onClick={() => setFontInfoBlocks((prev) => prev.filter((_, idx) => idx !== blockIndex))}>
                블록 삭제
              </RemoveButton>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <ImageUploadField
                label="이미지 (PC)"
                slug={slug}
                value={block.image_url}
                onChange={(url) =>
                  setFontInfoBlocks((prev) => prev.map((b, idx) => (idx === blockIndex ? { ...b, image_url: url } : b)))
                }
              />
              <ImageUploadField
                label="이미지 (Mobile)"
                slug={slug}
                value={block.image_mobile_url}
                onChange={(url) =>
                  setFontInfoBlocks((prev) => prev.map((b, idx) => (idx === blockIndex ? { ...b, image_mobile_url: url } : b)))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#3f3f46]">
              <input
                type="checkbox"
                checked={block.tight ?? false}
                onChange={(e) =>
                  setFontInfoBlocks((prev) => prev.map((b, idx) => (idx === blockIndex ? { ...b, tight: e.target.checked } : b)))
                }
                className="h-4 w-4 rounded border-black/20 accent-[#4f46e5]"
              />
              하단 여백 좁게 (블록 사이 간격을 줄입니다)
            </label>

            <div className="flex flex-col gap-3">
              <Hint>
                아래 각 항목은 폰트 하나를 소개하는 예시 카드입니다. "사용된 크기"와 "어디에 쓰였는지"는 값을 하나씩
                추가・삭제할 수 있습니다 — 사이트에도 각각 따로 표시됩니다.
              </Hint>
              {block.guides.map((guide, guideIndex) => {
                const updateGuide = (patch: Partial<typeof guide>) =>
                  setFontInfoBlocks((prev) =>
                    prev.map((b, idx) =>
                      idx === blockIndex
                        ? { ...b, guides: b.guides.map((g, gi) => (gi === guideIndex ? { ...g, ...patch } : g)) }
                        : b
                    )
                  );

                return (
                  <div key={guideIndex} className="grid grid-cols-2 gap-x-4 gap-y-3.5 bg-white rounded-lg border border-black/[0.06] p-4">
                    <div>
                      <Label className="text-xs">이름</Label>
                      <Input placeholder="예: Headline" value={guide.title} onChange={(e) => updateGuide({ title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">미리보기 문구</Label>
                      <Input
                        placeholder="예: we Design with purpose"
                        value={guide.sample}
                        onChange={(e) => updateGuide({ sample: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">굵기</Label>
                      <Input placeholder="예: Bold" value={guide.weight} onChange={(e) => updateGuide({ weight: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">자간</Label>
                      <Input
                        placeholder="예: -2.5%"
                        value={guide.letter_spacing}
                        onChange={(e) => updateGuide({ letter_spacing: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">사용된 크기 (px)</Label>
                      <ChipListEditor
                        values={guide.sizes}
                        onChange={(sizes) => updateGuide({ sizes })}
                        placeholder="24"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">어디에 쓰였는지 (html 태그)</Label>
                      <ChipListEditor
                        values={guide.tags}
                        onChange={(tags) => updateGuide({ tags })}
                        placeholder="h2"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <RemoveButton
                        onClick={() =>
                          setFontInfoBlocks((prev) =>
                            prev.map((b, idx) =>
                              idx === blockIndex ? { ...b, guides: b.guides.filter((_, gi) => gi !== guideIndex) } : b
                            )
                          )
                        }
                      >
                        가이드 삭제
                      </RemoveButton>
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  setFontInfoBlocks((prev) =>
                    prev.map((b, idx) =>
                      idx === blockIndex
                        ? {
                            ...b,
                            guides: [
                              ...b.guides,
                              { title: "", sample: "", weight: "", sizes: [], letter_spacing: "", tags: [] },
                            ],
                          }
                        : b
                    )
                  )
                }
              >
                <PlusIcon className="w-3.5 h-3.5" />
                가이드 추가
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setFontInfoBlocks((prev) => [...prev, emptyFontInfo()])}>
          <PlusIcon className="w-3.5 h-3.5" />
          폰트 블록 추가
        </Button>
      </Card>

      {/* Color Info */}
      <Card id="section-color" className="p-8 flex flex-col gap-4 scroll-mt-20">
        <SectionTitle
          icon={<PaletteIcon className="w-[18px] h-[18px]" />}
          title="컬러 팔레트"
          description="프로젝트에 사용된 색상을 카드 형태로 소개하는 섹션입니다. 배경색이 실제 카드에 칠해지는 색이고, hex 텍스트는 카드에 보이는 글자입니다."
        />
        <div>
          <Label>설명</Label>
          <Textarea
            value={colorInfo.description}
            onChange={(e) => setColorInfo((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="예: 컬러 시스템은 Black과 Gray의 단계 조절을 중심으로 구성하였습니다."
          />
        </div>
        {colorInfo.cards.map((card, i) => {
          const updateCard = (patch: Partial<(typeof colorInfo.cards)[number]>) =>
            setColorInfo((prev) => ({ ...prev, cards: prev.cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));

          return (
            <div key={i} className="flex gap-5 rounded-xl border border-black/[0.06] bg-[#f9f9fb] p-5">
              {/* 실제 공개 사이트의 컬러 카드와 같은 모양으로 미리보기 — 이름/배경색/글자색/테두리를
                  바꾸는 즉시 그대로 반영돼서, hex 값을 눈으로 바로 확인할 수 있다. */}
              <div
                className="flex h-28 w-28 shrink-0 flex-col justify-between overflow-hidden rounded-md p-3.5"
                style={{
                  background: card.background || "#000000",
                  color: card.text_color || "#ffffff",
                  border: card.border ? "1px solid #ddd" : undefined,
                }}
              >
                <span className="text-sm font-medium leading-tight break-all">{card.name || "이름"}</span>
                <span className="text-[11px] font-light leading-tight opacity-90 break-all">{card.hex_label || "#000000"}</span>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <Label className="text-xs">이름</Label>
                  <Input
                    placeholder="색상 이름 (예: Black)"
                    value={card.name}
                    onChange={(e) => updateCard({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">HEX 텍스트</Label>
                  <Input
                    placeholder="hex 텍스트 (예: #000000)"
                    value={card.hex_label}
                    onChange={(e) => updateCard({ hex_label: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">배경색</Label>
                  <div className="relative">
                    <input
                      type="color"
                      value={toColorInputValue(card.background, "#000000")}
                      onChange={(e) => updateCard({ background: e.target.value })}
                      className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 cursor-pointer rounded border border-black/10 bg-transparent p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
                      title="카드 배경색 선택"
                    />
                    <Input
                      placeholder="예: #000000"
                      value={card.background}
                      onChange={(e) => updateCard({ background: e.target.value })}
                      className="pl-12"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">글자색 (선택)</Label>
                  <div className="relative">
                    <input
                      type="color"
                      value={toColorInputValue(card.text_color ?? "", "#ffffff")}
                      onChange={(e) => updateCard({ text_color: e.target.value })}
                      className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 cursor-pointer rounded border border-black/10 bg-transparent p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
                      title="글자색 선택"
                    />
                    <Input
                      placeholder="기본값: 흰색"
                      value={card.text_color ?? ""}
                      onChange={(e) => updateCard({ text_color: e.target.value })}
                      className="pl-12"
                    />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end justify-between">
                <RemoveButton onClick={() => setColorInfo((prev) => ({ ...prev, cards: prev.cards.filter((_, idx) => idx !== i) }))} />
                <label className="flex items-center gap-1.5 text-xs text-[#71717a] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={card.border ?? false}
                    onChange={(e) => updateCard({ border: e.target.checked })}
                    className="h-4 w-4 rounded border-black/20 accent-[#4f46e5]"
                  />
                  테두리 표시
                </label>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setColorInfo((prev) => ({
              ...prev,
              cards: [...prev.cards, { name: "", hex_label: "", background: "#000000" }],
            }))
          }
        >
          <PlusIcon className="w-3.5 h-3.5" />
          색상 카드 추가
        </Button>
      </Card>

      {/* Main Image */}
      <Card id="section-main-image" className="p-8 flex flex-col gap-5 scroll-mt-20">
        <SectionTitle
          icon={<ImagePlaceholderIcon className="w-[18px] h-[18px]" />}
          title="메인 쇼케이스 이미지"
          description="상세페이지 맨 아래, 크게 보이는 마무리 섹션입니다. 화질 저하 없이 최대 1320px 폭으로 표시됩니다."
        />
        <ImageUploadField
          label="메인 이미지"
          slug={slug}
          value={mainImage.main_image_url}
          onChange={(url) => setMainImage((prev) => ({ ...prev, main_image_url: url }))}
        />
      </Card>

      <div className="sticky bottom-6 z-10 flex justify-end gap-3 bg-white/90 backdrop-blur rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(16,24,40,0.08)] px-5 py-4">
        <Link to="/admin">
          <Button type="button" variant="outline" size="md">
            취소
          </Button>
        </Link>
        <Button type="submit" variant="primary" size="md" disabled={saving}>
          {saving ? "저장 중..." : isEdit ? "수정 저장" : "등록"}
        </Button>
      </div>
    </form>
  );
}
