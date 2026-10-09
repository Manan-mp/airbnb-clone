import type { Amenity, Category, ListingPage, TokenResponse, User } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "staybnb.token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = body.detail[0]?.msg ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  listings: (qs: string, signal?: AbortSignal) => request<ListingPage>(`/listings?${qs}`, { signal }),
  amenities: () => request<Amenity[]>("/amenities"),
  categories: () => request<Category[]>("/categories"),
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  signup: (body: { email: string; password: string; name: string; role: "guest" | "host" }) =>
    request<TokenResponse>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<User>("/auth/me"),
  addWishlist: (id: number) => request<void>(`/wishlist/${id}`, { method: "PUT" }),
  removeWishlist: (id: number) => request<void>(`/wishlist/${id}`, { method: "DELETE" }),
};
