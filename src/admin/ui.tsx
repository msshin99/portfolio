import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, MouseEvent, ReactNode, TextareaHTMLAttributes } from "react";
import { InfoIcon } from "./icons";

/** 관리자 페이지 전역 디자인 토큰 & 기본 컴포넌트.
 *  모든 admin 화면이 이 파일의 클래스/컴포넌트를 공유해서 톤을 통일한다. */

export const ADMIN_BG = "bg-[#f6f6fb]";

export function Card({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <div id={id} className={`bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-9">
      <div>
        <h1 className="text-2xl font-semibold text-[#18181b] tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-[15px] text-[#71717a]">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

const buttonVariants = {
  primary: "bg-[#4f46e5] text-white hover:bg-[#4338ca]",
  secondary: "bg-[#f0f0f5] text-[#3f3f46] hover:bg-[#e4e4ec]",
  outline: "bg-white text-[#3f3f46] border border-black/10 hover:bg-[#f9f9fb]",
  danger: "bg-white text-[#dc2626] border border-[#dc2626]/25 hover:bg-[#fef2f2]",
  ghost: "bg-transparent text-[#71717a] hover:bg-black/[0.04] hover:text-[#18181b]",
};

const buttonSizes = {
  sm: "text-[13px] h-8 px-3",
  md: "text-sm h-10 px-4",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export function Button({ variant = "secondary", size = "md", className = "", ...rest }: ButtonProps) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`} {...rest} />;
}

export function Label({ className = "", ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-[13px] font-medium text-[#3f3f46] mb-1.5 ${className}`} {...rest} />;
}

const fieldBase =
  "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-[#18181b] placeholder:text-[#a1a1aa] outline-none transition-shadow duration-150 focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/15";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} resize-y ${className}`} {...rest} />;
}

/** 페이지 안에서 여러 카드를 의미 단위로 묶을 때 카드들 위에 붙이는 구획 제목.
 *  길어지는 사이트 콘텐츠 페이지처럼, 어떤 카드들이 화면 어느 영역에 대응하는지
 *  한눈에 구분되게 해준다. */
export function GroupHeading({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-2 first:mt-0">
      <h2 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-[#71717a] whitespace-nowrap">
        {icon && <span className="text-[#a1a1aa]">{icon}</span>}
        {title}
      </h2>
      <div className="h-px flex-1 bg-black/[0.07]" />
      {description && <p className="text-xs text-[#a1a1aa] whitespace-nowrap">{description}</p>}
    </div>
  );
}

export function SectionTitle({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f46e5]/8 text-[#4f46e5] shrink-0">
          {icon}
        </span>
      )}
      <div>
        <h2 className="text-base font-semibold text-[#18181b]">{title}</h2>
        {description && <p className="text-[13px] text-[#a1a1aa] mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "accent"; children: ReactNode }) {
  const tones = {
    neutral: "bg-black/5 text-[#52525b]",
    success: "bg-[#16a34a]/10 text-[#16a34a]",
    accent: "bg-[#4f46e5]/10 text-[#4f46e5]",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

/** 필드/섹션 아래 붙는 짧은 설명. 처음 보는 사용자도 이 항목이 어디에 어떻게 쓰이는지
 *  바로 알 수 있도록, 라벨의 원문 필드명 대신 여기에 실제 화면 기준으로 풀어서 설명한다. */
export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-[#a1a1aa]">{children}</p>;
}

export function InfoBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#4f46e5]/15 bg-[#4f46e5]/[0.04] px-5 py-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4f46e5]/10 text-[#4f46e5]">
        <InfoIcon className="w-4 h-4" />
      </span>
      <div className="text-sm text-[#3f3f46]">
        <p className="font-semibold text-[#18181b] mb-1">{title}</p>
        <div className="leading-relaxed [&_b]:font-semibold [&_b]:text-[#18181b]">{children}</div>
      </div>
    </div>
  );
}

/** 길게 이어지는 폼/페이지 맨 위에 붙는 목차. 전체 섹션이 몇 개고 순서가 어떻게 되는지
 *  한눈에 보여주고, 클릭하면 해당 섹션으로 바로 스크롤 이동한다. 스크롤하는 동안 화면
 *  상단에 계속 붙어 있어(sticky) 지금 폼의 어느 지점을 보고 있는지 감을 잃지 않게 해준다. */
export function TocNav({ items }: { items: { id: string; label: string }[] }) {
  function handleClick(e: MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-4 z-10 rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <ol className="flex flex-wrap gap-x-1 gap-y-1.5 text-[13px]">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[#52525b] hover:bg-[#4f46e5]/8 hover:text-[#4f46e5] transition-colors"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/5 text-[10px] font-semibold text-[#71717a]">
                {i + 1}
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon && <span className="text-[#d4d4d8]">{icon}</span>}
      <p className="text-sm font-medium text-[#52525b]">{title}</p>
      {description && <p className="text-xs text-[#a1a1aa]">{description}</p>}
    </div>
  );
}
