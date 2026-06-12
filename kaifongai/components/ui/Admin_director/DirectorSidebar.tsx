"use client"
import { useState } from "react"
import Image from "next/image"
import KaifongLogo from "../../../public/logo/Kaifong_logo2.png"
import { MdOutlineDashboard, MdSettings, MdKeyboardArrowDown } from "react-icons/md"
import { TbBook2 } from "react-icons/tb"
import { FaRegCheckSquare, FaRegUserCircle } from "react-icons/fa"
import Link from 'next/link';
import { Sarabun } from "next/font/google";

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

type SidebarProps = {
    isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const [memberOpen, setMemberOpen] = useState(false)
    const [manualOpen, setManualOpen] = useState(false)

    return (
        <aside
            className={`fixed top-0 left-0 z-40 h-screen w-[276px] bg-foreground3 shadow-lg transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            <div className="flex flex-row px-6 py-2 mt-2">
                <div className={`${thaiFont.className}flex flex-col items-start`}>
                    <div className="h-10 flex items-start px-0 py-2 text-xl font-bold text-accent">
                        KAIFONG AI
                    </div>
                    <div className="h-10 flex items-start px-0 text-sm font-light text-white">
                        ระบบแจ้งเรื่องร้องทุกข์
                    </div>
                </div>

                <div className="ml-auto flex items-center justify-end">
                    <Image
                        src={KaifongLogo}
                        alt="KaifongLogo"
                        className="w-18 h-auto"
                    />
                </div>
            </div>

            <hr className="mx-5 border-gray-200" />

        <div className="p-4 text-white text-lg">
            <Link
                href="/director/dashboard"
                className="block rounded-lg px-3 py-2 hover:bg-gray-100/10 transition-all duration-300"
            >
                <div className="flex flex-row items-center gap-3">
                    <MdOutlineDashboard size={24} />
                    <div>แดชบอร์ด</div>
                </div>
            </Link>

            <hr className="mx-1 border-black/20" />

            <Link
                href="/director/evaluate"
                className="block rounded-lg px-3 py-2 hover:bg-gray-100/10 transition-all duration-300"
            >
                <div className="flex flex-row items-center gap-3">
                    <FaRegCheckSquare  size={24} />
                    <div>ตรวจสอบ / ประเมินผล</div>
                </div>
            </Link>

            <hr className="mx-1 border-black/20" />

            <div className="py-1">
                <button
                    type="button"
                    onClick={() => setManualOpen((prev) => !prev)}
                    className="block w-full rounded-lg px-3 py-2 hover:bg-gray-100/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex flex-row items-center gap-3">
                            <TbBook2 size={24} />
                            <div>คู่มือการใช้งาน</div>
                        </div>

                        <MdKeyboardArrowDown
                            size={24}
                            className={`transition-transform duration-300 ${
                                manualOpen ? "rotate-180" : ""
                            }`}
                        />
                    </div>
                </button>

                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        manualOpen ? "max-h-40 mt-1" : "max-h-0"
                    }`}
                >
                    <div className="ml-10 space-y-1 text-base">
                        <Link
                            href="/director/manual/staff"
                            className="block rounded-lg px-3 py-2 hover:bg-gray-100/10 transition-all duration-300"
                        >
                            คู่มือการใช้งานช่าง
                        </Link>

                        <Link
                            href="/director/manual/reporter"
                            className="block rounded-lg px-3 py-2 hover:bg-gray-100/10 transition-all duration-300"
                        >
                            คู่มือการใช้งานเจ้าหน้าที่
                        </Link>

                        <Link
                            href="/director/manual/user"
                            className="block rounded-lg px-3 py-2 hover:bg-gray-100/10 transition-all duration-300"
                        >
                            คู่มือการใช้งานประชาชน
                        </Link>
                    </div>
                </div>
            </div>

            <hr className="mx-1 border-black/20" />
        </div>

            <div className="absolute bottom-0 w-full px-8 py-6 text-white text-xl">
                {/*บอกโรลว่าเป็นใคร*/}
                <div className="flex flex-row items-center gap-2">
                    <FaRegUserCircle size="2rem" />
                    <div>ผู้อำนวยการ</div>
                </div>
            </div>
        </aside>
    )
}