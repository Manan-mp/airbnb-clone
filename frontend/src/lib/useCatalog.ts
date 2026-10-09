"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { Amenity, Category } from "./types";

let cache: { categories: Category[]; amenities: Amenity[] } | null = null;

/** Categories + amenities rarely change: fetch once per page load. */
export function useCatalog() {
  const [data, setData] = useState(cache ?? { categories: [] as Category[], amenities: [] as Amenity[] });
  useEffect(() => {
    if (cache) return;
    Promise.all([api.categories(), api.amenities()])
      .then(([categories, amenities]) => {
        cache = { categories, amenities };
        setData(cache);
      })
      .catch(() => {});
  }, []);
  return data;
}
