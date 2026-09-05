"use client";
/* eslint-disable @next/next/no-img-element -- Local, revocable blob previews must not use the image optimization endpoint. */
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  X,
} from "lucide-react";
import { FILE_ACCEPT, fileSize, validatePreviewFile } from "@/lib/resources";
import { cn } from "@/lib/utils";

/** Local selection only. No network request, persisted blob, or upload claim. */
export function FileDropzone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (
      !file ||
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const select = (files: FileList | null) => {
    setError("");
    if (!files?.length) return;
    if (files.length > 1) {
      setError("Choose one file at a time for a local preview.");
      return;
    }
    const selected = files[0];
    const problem = validatePreviewFile(selected);
    if (problem) {
      setError(problem);
      return;
    }
    onChange(selected);
  };
  return (
    <div className="space-y-3">
      <input
        ref={input}
        id={id}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose an educational file to preview"
        onChange={(e) => {
          select(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current--;
          if (!dragDepth.current) setDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          dragDepth.current = 0;
          select(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed transition-colors",
          dragging
            ? "border-brand-500 bg-brand-100"
            : "border-slate-300 bg-slate-50 hover:border-brand-400",
        )}
      >
        <button
          type="button"
          className="flex w-full flex-col items-center justify-center px-5 py-8 text-center"
          onClick={() => input.current?.click()}
          aria-describedby={`${id}-help`}
        >
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-brand-600 shadow-sm">
            <UploadCloud className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">
            {dragging
              ? "Drop your file to preview"
              : "Drop a little knowledge here"}
          </span>
          <span className="mt-1.5 text-xs text-muted">
            Drag a file here, or{" "}
            <span className="font-semibold text-brand-600 underline underline-offset-4">
              browse files
            </span>
          </span>
          <span id={`${id}-help`} className="mt-4 text-[10px] text-muted">
            PDF, DOC, DOCX, PNG, JPG, WebP, GIF · Up to 20 MB
          </span>
        </button>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            role="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {file && (
          <motion.div
            key={`${file.name}-${file.size}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-xl border border-line bg-surface"
          >
            {preview && (
              <div className="flex h-36 items-center justify-center bg-slate-100 p-3">
                {/* Object URL stays local and is revoked when selection changes. */}
                <img
                  src={preview}
                  alt={`Local preview of ${file.name}`}
                  className="max-h-full max-w-full rounded object-contain"
                />
              </div>
            )}
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                {preview ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-all text-xs font-semibold">
                  {file.name}
                </span>
                <span className="mt-1 block text-[10px] text-muted">
                  {file.name.split(".").pop()?.toUpperCase()} ·{" "}
                  {fileSize(file.size)}
                </span>
                <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[9px] font-medium text-muted">
                  Selected locally · Not uploaded
                </span>
              </span>
              <button
                type="button"
                className="icon-button -mr-1 -mt-1"
                aria-label="Remove selected file"
                onClick={() => {
                  onChange(null);
                  setError("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
