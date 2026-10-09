"use client";

import { useToast } from "@/components/ui/Toast";

/** Native share sheet when available, otherwise copy the link. */
export function useShare(title: string) {
  const toast = useToast();
  return async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.show("Link copied to clipboard");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.show("Couldn’t share this link", "error");
    }
  };
}
