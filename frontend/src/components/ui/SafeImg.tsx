"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { imgSrc } from "@/lib/img";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width"> & {
  src: string;
  /** Largest width worth downloading (about 2x the displayed width). A half-size candidate is offered too. */
  width: number;
  /** Candidate widths for fluid images; overrides the default half/full pair. */
  widths?: number[];
};

/**
 * <img> that asks the image host for a size that fits, and falls back to a neutral placeholder
 * when the photo fails to load (bad URL, deleted upload, offline).
 */
export function SafeImg({ src, width, widths, sizes, alt = "", className, ...rest }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src)
    return (
      <div role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={`${className ?? ""} flex items-center justify-center bg-surface-control text-ink-disabled`}>
        <ImageOff size={24} />
      </div>
    );
  const list = widths ?? [Math.round(width / 2), width];
  const srcSet = src.includes("images.unsplash.com") ? list.map((w) => `${imgSrc(src, w)} ${w}w`).join(", ") : undefined;
  return (
    <img
      {...rest}
      src={imgSrc(src, width)}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? `${Math.round(width / 2)}px`) : undefined}
      alt={alt}
      onError={() => setFailed(src)}
      className={className}
    />
  );
}
