import type { Metadata } from "next";
import DirectorShell from "../directorshell";
import {Sarabun} from "next/font/google";

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "700"]
})

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DirectorShell>{children}</DirectorShell>;
}