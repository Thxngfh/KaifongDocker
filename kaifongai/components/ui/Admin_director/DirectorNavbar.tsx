"use client"
import { usePathname } from 'next/navigation';
import { Sarabun } from "next/font/google";

const thaiFont = Sarabun({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

type NavbarProps = {
    isOpen: boolean
    onMenuClick: () => void
}
export default function Navbar({ isOpen, onMenuClick }: NavbarProps) {

    const pathname = usePathname();
    const Linknames = ["/director/dashboard",
                        "/director/evaluate",
                        "/director/manual/staff",
                        "/director/manual/reporter",
                        "/director/evaluate/detail/",
                        "/director/manual/user",
                    ]

    return (
        <div
            className={`${thaiFont.className} fixed top-0 right-0 z-30 h-16 bg-secondary flex items-center justify-between px-6 shadow-md transition-all duration-300 ${
                isOpen
                    ? "left-[276px] w-[calc(100%-276px)]"
                    : "left-0 w-full"
            }`}
        >
            <span className="flex items-center gap-2">
                <div className="cursor-pointer z-50" onClick={onMenuClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-9">
                        <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                    </svg>
                </div>

                <div className={`font-bold text-accent transition-all duration-300 ${isOpen ? "text-lg" : "text-2xl"}`}>
                    {pathname === Linknames[0] ? "แดชบอร์ด" : ""}
                    {pathname === Linknames[1] ? "ตรวจสอบ / ประเมินผล" : ""}
                    {pathname === Linknames[2] && (
                        <>
                            <span className="text-gray-400">คู่มือการใช้งาน</span>
                            <span className="mx-2 text-white">/</span>
                            <span className="text-accent">คู่มือการใช้งานช่าง</span>
                        </>
                    )}
                    {pathname === Linknames[3] && (
                        <>
                            <span className="text-gray-400">คู่มือการใช้งาน</span>
                            <span className="mx-2 text-white">/</span>
                            <span className="text-accent">คู่มือการใช้งานผู้แจ้งเรื่อง</span>
                        </>
                    )}
                    {pathname.startsWith(Linknames[4]) && (
                        <>
                            <span className="text-gray-400">รายการร้องทุกข์</span>
                            <span className="mx-2 text-white">/</span>
                            <span className="text-accent">รายละเอียดคำร้อง</span>
                        </>
                    )}
                    {pathname === Linknames[5] && (
                        <>
                            <span className="text-gray-400">คู่มือการใช้งาน</span>
                            <span className="mx-2 text-white">/</span>
                            <span className="text-accent">คู่มือการใช้งานประชาชน</span>
                        </>
                    )}
                </div>
            </span>

            <div className="flex flex-row items-center gap-4">
                <div className="relative w-full max-w-lg">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/70">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#333847" className="h-4 w-4">
                            <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
                        </svg>
                    </span>

                    <input
                        type="text"
                        className="w-64 text-[#333847] rounded-full border border-white/20 bg-[#EAEDFF] py-2.5 pl-12 pr-4 text-sm text-gray placeholder:text-[#333847] outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                        placeholder="ค้นหาชื่อ หรือหน่วยงาน..."
                    />
                </div>

                <div className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                </div>

                <div className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}