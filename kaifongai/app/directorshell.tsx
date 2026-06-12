"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Admin_director/DirectorNavbar";
import Sidebar from "@/components/ui/Admin_director/DirectorSidebar";


export default function DirectorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

    useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "director") {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen w-full bg-surface">
      <Sidebar isOpen={isOpen} />
      <Navbar isOpen={isOpen} onMenuClick={() => setIsOpen((prev) => !prev)} />
      <main className={`pt-16 transition-all duration-300 ${isOpen ? "ml-[276px]" : "ml-0"}`}>
        {children}
      </main>
    </div>
  );
}