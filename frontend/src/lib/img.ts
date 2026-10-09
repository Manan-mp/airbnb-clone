/** Unsplash URLs carry a width parameter; request only what the viewport needs. */
export function imgSrc(url: string, width: number): string {
  return url.includes("images.unsplash.com") ? url.replace(/w=\d+/, `w=${width}`) : url;
}
