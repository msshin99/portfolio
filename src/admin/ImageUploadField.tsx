import { useState } from "react";
import { uploadPortfolioImage } from "../lib/adminApi";
import { ImagePlaceholderIcon } from "./icons";

interface ImageUploadFieldProps {
  label: string;
  slug: string;
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ label, slug, value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPortfolioImage(slug, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-[13px] font-medium text-[#3f3f46]">{label}</span>}
      <label
        className={`group relative flex h-32 w-full max-w-[220px] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          value ? "border-transparent" : "border-black/10 hover:border-[#4f46e5]/40 hover:bg-[#4f46e5]/[0.03]"
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
              <span className="text-xs font-medium text-white">{uploading ? "업로드 중..." : "이미지 변경"}</span>
            </div>
          </>
        ) : (
          <>
            <ImagePlaceholderIcon className="w-6 h-6 text-[#d4d4d8]" />
            <span className="text-xs text-[#a1a1aa]">{uploading ? "업로드 중..." : "클릭해서 업로드"}</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {error && <span className="text-xs text-[#dc2626]">{error}</span>}
    </div>
  );
}
