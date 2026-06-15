import type { Metadata } from "next";
import DirectorShell from "../directorshell";
import {Sarabun} from "next/font/google";

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "700"]
})

export const metadata: Metadata = {
  title: "Director",
  description: "Director dashboard",
};

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DirectorShell>{children}</DirectorShell>;
}