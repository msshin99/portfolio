import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import StaggerReveal from "../common/StaggerReveal";

const POP_SPRING = { type: "spring" as const, stiffness: 260, damping: 18 };
const SHELL_CLASS =
  "rounded-[4px] border border-[#e5e5ec] bg-white p-4 outline-none transition-colors duration-200 hover:border-[#0077ff] focus-within:border-[#0077ff]";

/** 카드 하나가 화면에 들어왔는지를 판단하는 훅 — ButtonStyleGuide와 같은 방식으로, 카드가
 *  뜬 다음 안의 인풋이 스프링으로 팝인하는 연출에 쓴다. */
function useCardReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return { ref, inView };
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6L8 10L12 6" stroke="#767676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="pointer-events-none shrink-0">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="#767676" strokeWidth="1.3" />
      <path d="M2.5 6.5H13.5" stroke="#767676" strokeWidth="1.3" />
      <path d="M5.5 2V4.5" stroke="#767676" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 2V4.5" stroke="#767676" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M10 4L6 8L10 12" : "M6 4L10 8L6 12";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={d} stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M2.5 7.2L5.5 10.2L11.5 4" stroke="#0077ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SELECT_OPTIONS = ["전체", "옵션 1", "옵션 2", "옵션 3"];

/** 클릭하면 옵션 목록이 펼쳐지는 실제 동작하는 드롭다운. 바깥을 클릭하면 닫힌다. */
function SelectField({ width, active }: { width: number; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(SELECT_OPTIONS[0]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={active ? { opacity: 1, scale: 1 } : undefined}
      transition={{ ...POP_SPRING, delay: 0.2 }}
      style={{ width }}
      className="relative max-w-full"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 font-ko text-sm text-black ${SHELL_CLASS}`}
      >
        {value}
        <ChevronDownIcon open={open} />
      </button>
      {open ? (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-[4px] border border-[#e5e5ec] bg-white py-1">
          {SELECT_OPTIONS.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  setValue(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left font-ko text-sm transition-colors duration-150 hover:bg-[#f4f5f9] ${
                  opt === value ? "text-[#0077ff]" : "text-black"
                }`}
              >
                {opt}
                {opt === value ? <CheckIcon /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.div>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** year/month(0-based) 달의 날짜 그리드 — 앞뒤로 null을 채워 항상 7의 배수 길이로 반환한다. */
function getMonthGrid(year: number, month: number) {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** 브라우저 기본 달력 대신 직접 디자인한 커스텀 캘린더 팝오버 — 월 이동, 오늘/선택일
 *  강조까지 다른 인풋과 같은 톤(테두리만, 그림자 없음)으로 만든다. */
function DateField({ width, active }: { width: number; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | null>(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={active ? { opacity: 1, scale: 1 } : undefined}
      transition={{ ...POP_SPRING, delay: 0.2 }}
      style={{ width }}
      className="relative max-w-full"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 font-ko text-sm ${
          selected ? "text-black" : "text-[#999999]"
        } ${SHELL_CLASS}`}
      >
        {selected ? formatDate(selected) : "날짜를 선택해주세요"}
        <CalendarIcon />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-10 mt-1.5 w-[272px] max-w-[85vw] rounded-[4px] border border-[#e5e5ec] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="이전 달"
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#f4f5f9]"
            >
              <ChevronIcon direction="left" />
            </button>
            <span className="font-ko text-sm font-semibold text-black">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="다음 달"
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#f4f5f9]"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-center font-ko text-xs text-sub-tertiary-txt">
                {w}
              </span>
            ))}
            {getMonthGrid(viewYear, viewMonth).map((day, i) => {
              if (day === null) return <span key={i} />;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isSelected = selected && formatDate(selected) === formatDate(cellDate);
              const isToday = !isSelected && formatDate(today) === formatDate(cellDate);
              return (
                <div key={i} className="flex justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(cellDate);
                      setOpen(false);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-ko text-xs transition-colors duration-150 ${
                      isSelected
                        ? "bg-[#0077ff] text-white"
                        : isToday
                          ? "font-semibold text-[#0077ff]"
                          : "text-black hover:bg-[#f4f5f9]"
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

/** 실제로 타이핑해서 값을 입력할 수 있는 비밀번호 인풋(입력 시 문자가 마스킹된다). */
function PasswordField({ width, active }: { width: number; active: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={active ? { opacity: 1, scale: 1 } : undefined}
      transition={{ ...POP_SPRING, delay: 0.2 }}
      style={{ width }}
      className={`max-w-full ${SHELL_CLASS}`}
    >
      <input
        type="password"
        placeholder="비밀번호를 입력해주세요"
        className="w-full border-none bg-transparent font-ko text-sm text-black outline-none placeholder:text-[#999999]"
      />
    </motion.div>
  );
}

/** 예시 카드 하나(px 라벨 + 인풋)를 감싸는 공통 레이아웃 — ButtonStyleGuide 카드와 같은
 *  크기·배경(h-[249px], bg-[#f8f8fa])을 쓴다. */
function InputCard({ label, children }: { label: string; children: (inView: boolean) => ReactNode }) {
  const { ref, inView } = useCardReveal();
  return (
    <div ref={ref} className="flex-1 flex flex-col h-[249px] rounded-md bg-[#f8f8fa] p-8">
      <p className="font-ko text-sm leading-5 tracking-[-0.35px] text-sub-secondary-txt">{label}</p>
      <div className="flex flex-1 items-center justify-center">{children(inView)}</div>
    </div>
  );
}

export default function InputStyleGuide() {
  return (
    <div className="input-info max-w-[1530px] mx-auto mb-20 max-lg:mb-14 max-sm:mb-8">
      <p className="font-ko text-2xl font-semibold leading-normal tracking-[-0.6px] text-[#111] mb-[18px] max-sm:text-xl">
        기본 인풋
      </p>
      <ul className="flex flex-col gap-2.5 mb-10 max-sm:mb-6">
        <li className="flex items-center gap-2.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-sub-secondary-txt" />
          <span className="font-ko text-lg leading-[26px] tracking-[-0.45px] text-sub-secondary-txt max-sm:text-base">
            모든 버튼 및 탭메뉴의 사이즈는 <b className="font-semibold text-sub-primary-txt">padding: 16px 16px</b> 및
            폰트사이즈는 <b className="font-semibold text-sub-primary-txt">body3</b>로 통일
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-sub-secondary-txt" />
          <span className="font-ko text-lg leading-[26px] tracking-[-0.45px] text-sub-secondary-txt max-sm:text-base">
            width의 크기는 기본 480px를 기준(회원정보페이지)으로 두고{" "}
            <b className="font-semibold text-sub-primary-txt">상황에따라 크기 자유롭게 조절</b>
          </span>
        </li>
      </ul>

      {/* ButtonStyleGuide와 같은 방식으로, 카드가 뒤로 젖혀진 상태(rotateX)에서 순서대로
          떠오르며 등장하고, 각 카드 안의 인풋은 카드가 자리 잡은 다음 스프링으로 팝인한다.
          세 인풋 모두 실제로 조작 가능하다 — 첫 번째는 클릭하면 옵션이 펼쳐지고, 두 번째는
          클릭하면 브라우저 달력이 뜨고, 세 번째는 실제로 비밀번호를 타이핑할 수 있다. */}
      <StaggerReveal
        as="div"
        className="flex gap-10 max-lg:flex-col"
        y={28}
        fromScale={0.95}
        rotateX={12}
        stagger={0.12}
      >
        <InputCard label="140px">{(inView) => <SelectField width={140} active={inView} />}</InputCard>
        <InputCard label="220px">{(inView) => <DateField width={220} active={inView} />}</InputCard>
        <InputCard label="480px">{(inView) => <PasswordField width={480} active={inView} />}</InputCard>
      </StaggerReveal>
    </div>
  );
}
