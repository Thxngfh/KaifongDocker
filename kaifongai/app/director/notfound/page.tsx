import Link from "next/link";

export default function DirectorNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-3">ไม่พบหน้าที่ต้องการ</h1>
        <p className="text-gray-600 mb-6">ลิงก์นี้อาจยังไม่ได้สร้าง หรือพิมพ์ path ผิด</p>
        <Link
          href="/director/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-6 py-3 font-bold text-gray-800 transition-colors hover:bg-yellow-500"
        >
          กลับไปแดชบอร์ด
        </Link>
      </div>
    </div>
  );
}