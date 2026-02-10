"use client";

import { useEffect } from "react";

const HYDRATE_KEY = "dispatch-hydrated";

export function HydrateOnLaunch() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem(HYDRATE_KEY)) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5052";
    fetch(`${apiUrl}/api/hydrate`, { method: "POST" })
      .then(() => sessionStorage.setItem(HYDRATE_KEY, "true"))
      .catch(console.error);
  }, []);

  return null;
}
