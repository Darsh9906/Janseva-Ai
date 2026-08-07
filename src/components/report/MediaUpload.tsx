"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, Film } from "lucide-react";

interface Props {
  onSelect: (file: File | null) => void;
}

export default function MediaUpload({ onSelect }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      setIsVideo(file.type.startsWith("video"));
      onSelect(file);
    },
    [onSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "video/mp4": [],
      "video/quicktime": [],
    },
    multiple: false,
  });

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onSelect(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative flex h-72 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white/70 transition-colors ${
        isDragActive ? "border-primary bg-primary-50" : "border-line hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full"
          >
            {isVideo ? (
              <video src={preview} className="h-full w-full object-contain" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-full w-full object-contain" />
            )}
            <button
              onClick={clear}
              className="absolute right-3 top-3 rounded-full bg-dark/60 p-2 text-white backdrop-blur hover:bg-danger"
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center text-ink-soft"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <UploadCloud size={28} />
            </span>
            <p className="mt-4 text-base font-semibold text-ink">
              {isDragActive ? "Drop it here" : "Upload a photo or video"}
            </p>
            <p className="mt-1 text-sm">Drag &amp; drop, or click to browse</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
              <Film size={13} /> JPG · PNG · WEBP · MP4
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
