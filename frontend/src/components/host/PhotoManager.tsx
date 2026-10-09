"use client";

import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";

function PhotoThumb({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="aspect-card w-28 shrink-0 overflow-hidden rounded-sm bg-surface-control md:w-36">
      {broken ? (
        <div className="flex size-full items-center justify-center p-2 text-center text-xs text-ink-secondary">Can’t load preview</div>
      ) : (
        <img src={url} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
      )}
    </div>
  );
}

/** Photos by URL or upload, with preview, remove and reorder (first photo is the cover). */
export function PhotoManager({ urls, onChange, error }: { urls: string[]; onChange: (u: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addUrl() {
    const value = draft.trim();
    if (!/^https?:\/\/\S+$/i.test(value)) return setDraftError("Enter a full image address starting with http:// or https://");
    if (urls.includes(value)) return setDraftError("That photo is already added");
    setDraftError(null);
    setDraft("");
    onChange([...urls, value]);
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        added.push((await api.upload(file)).url);
      } catch (e) {
        setUploadError(`${file.name}: ${e instanceof ApiError ? e.message : "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) onChange([...urls, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, d: number) => {
    const next = [...urls];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const icon = "flex size-8 items-center justify-center rounded-full border border-line transition-colors duration-150 ease-airy hover:border-ink disabled:opacity-30 disabled:hover:border-line";

  return (
    <div>
      {urls.length > 0 && (
        <ol className="mb-4 space-y-3" data-testid="photo-list">
          {urls.map((u, i) => (
            <li key={u} className="flex items-center gap-4 rounded-md border border-line p-3">
              <PhotoThumb url={u} />
              <div className="min-w-0 flex-1">
                {i === 0 && <p className="mb-1 text-2xs font-semibold uppercase">Cover photo</p>}
                <p className="truncate text-base text-ink-secondary">{u}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" aria-label="Move photo up" disabled={i === 0} onClick={() => move(i, -1)} className={icon}><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move photo down" disabled={i === urls.length - 1} onClick={() => move(i, 1)} className={icon}><ArrowDown size={14} /></button>
                <button type="button" aria-label="Remove photo" onClick={() => onChange(urls.filter((x) => x !== u))} className={icon}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="Paste an image URL"
          aria-label="Photo URL"
          className="h-12 min-w-0 flex-1 rounded-md border border-ink-muted px-4 text-md outline-none focus:border-2 focus:border-ink"
        />
        <button type="button" onClick={addUrl} className="h-12 rounded-md border border-ink px-5 text-md font-medium transition-colors duration-200 ease-airy hover:bg-surface-subtle">
          Add
        </button>
      </div>
      {draftError && <p role="alert" className="mt-2 text-base text-brand-deep">{draftError}</p>}
      <div className="mt-3 flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} data-testid="photo-file" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading > 0} className="flex items-center gap-2 rounded-md bg-surface-control px-4 py-3 text-md font-medium transition-colors duration-200 ease-airy hover:bg-line-soft disabled:opacity-60">
          <ImagePlus size={16} /> {uploading > 0 ? "Uploading…" : "Upload photos"}
        </button>
        <span className="text-base text-ink-secondary">JPEG, PNG or WebP, up to 5 MB each</span>
      </div>
      {uploadError && <p role="alert" className="mt-2 text-base text-brand-deep">{uploadError}</p>}
      {error && <p role="alert" className="mt-2 text-base text-brand-deep">{error}</p>}
    </div>
  );
}
