import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LIFFProvider } from "../providers/liff-providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "LIFF App",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

const API_KEY = process.env.GOOGLE_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />
        <LIFFProvider>{children}</LIFFProvider>
        
      </body>
    </html>
  );
}
