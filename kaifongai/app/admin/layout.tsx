import type { Metadata } from "next";
import AdminShell from "../adminshell";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell> <div className="admin-theme">{children}</div></AdminShell>;
}

