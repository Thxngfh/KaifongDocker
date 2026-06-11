"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const liffState = params.get("liff.state");

    console.log("liff.state:", liffState);
    console.log("pathname:", window.location.pathname);

    const currentPath = window.location.pathname;
    let realPath = "";

    if (liffState) {
      realPath = decodeURIComponent(liffState);
    } else {
      const parts = currentPath.split("/").filter(Boolean);
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (liffId && parts[0] === liffId) {
        parts.shift();
      }

      realPath = parts.length > 0 ? `/${parts.join("/")}` : "";
    }

    if (!realPath) {
      realPath = "/userform/Reporter_Info";
    }

    console.log("realPath:", realPath);

    if (currentPath !== realPath) {
      router.replace(realPath);
    }
  }, [router]);

  return null;
}
