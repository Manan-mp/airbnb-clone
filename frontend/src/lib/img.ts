/** Unsplash URLs carry width and quality parameters; request only what the viewport needs. */
export function imgSrc(url: string, width: number): string {
  if (!url.includes("images.unsplash.com")) return url;
  const quality = width <= 800 ? 60 : 70;
  return url.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, `q=${quality}`);
}
