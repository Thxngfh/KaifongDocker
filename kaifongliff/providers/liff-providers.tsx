"use client";

import { Liff } from "@line/liff";
import { createContext, useContext, useEffect, useState } from "react";

interface LIFFContextValue {
  liff: Liff | null;
  isLoading: boolean;
  liffError: string | null;
}

const LIFFContext = createContext<LIFFContextValue>({
  liff: null,
  isLoading: true,
  liffError: null,
});

function LIFFProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Execute liff.init() when the app is initialized
  useEffect(() => {
    // to avoid `window is not defined` error
    import("@line/liff")
      .then((liff) => liff.default)
      .then((liff) => {
        console.log("LIFF init...");
        liff
          .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
          .then(() => {
            console.log("LIFF init succeeded.");
            setLiffObject(liff);

            if (liff.isLoggedIn()) {
              liff.getProfile().then((profile) => {
                console.log("LIFF profile:", profile);
                fetch("/api/auth/liff-login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    lineUserId: profile.userId,
                    displayName: profile.displayName,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => console.log("Login result:", data))
                  .catch((err) => console.error("Login failed:", err));
              });
            } else {
              liff.login();
            }
          })
          .catch((error: Error) => {
            console.log("LIFF init failed.");
            setLiffError(error.toString());
          })
          .finally(() => {
            setIsLoading(false);
          });
      });
  }, []);

  const value: LIFFContextValue = {
    liff: liffObject,
    isLoading,
    liffError: liffError,
  };
  return <LIFFContext.Provider value={value}>{children}</LIFFContext.Provider>;
}

function useLIFF(): LIFFContextValue {
  const liff = useContext(LIFFContext);
  if (!liff) {
    throw new Error("useLIFF must be used within a LIFFProvider");
  }
  return liff;
}

export { LIFFProvider, useLIFF };
