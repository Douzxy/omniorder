import { useRef } from "react";

interface ImageUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  label?: string;
}

export default function ImageUpload({ onUpload, isUploading, label = "Upload" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="cursor-pointer flex-shrink-0 h-[38px] flex items-center">
      <span
        className={`text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-100 text-brand hover:bg-neutral-200 transition-all whitespace-nowrap ${isUploading ? "opacity-50" : ""}`}
      >
        {isUploading ? "Upload..." : label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUpload}
        disabled={isUploading}
      />
    </label>
  );
}
