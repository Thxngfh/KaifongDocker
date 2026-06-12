"use client";
import Image from "next/image";
import logo from "../public/logo/NT_Logo.png";
import kaifong from "../public/logo/Kaifong_logo.png";
import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const emailadmin = "admin@gmail.com";
  const passwordadmin = "admin123";
  const emaildirector = "director@gmail.com";
  const passworddirector = "director123";

  const LoginForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (email === emailadmin && password === passwordadmin) {
      localStorage.setItem("role", "admin");
      router.push("/admin/dashboard");
      return;
    }

    if (email === emaildirector && password === passworddirector) {
      localStorage.setItem("role", "director");
      router.push("/director/dashboard");
      return;
    }

    setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  };

  return (
    <div className="h-screen bg-accent flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl rounded-3xl bg-surface2 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
          <aside className="flex w-full lg:w-1/2 items-center justify-center">
            <Image
              src={logo}
              alt="NT Logo"
              className="w-40 sm:w-52 lg:w-72 xl:w-80 h-auto drop-shadow-lg"
              priority
            />
          </aside>

          <div className="w-full lg:w-1/2 rounded-3xl bg-surface p-8 sm:p-10 lg:p-12 flex items-center justify-center drop-shadow-lg">
            <main className="flex w-full flex-col justify-center items-center">
              <div className="flex flex-row items-center justify-center gap-3 mb-8 w-full">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground3">
                  เข้าสู่ระบบ
                </h1>
                <Image
                  src={kaifong}
                  alt="Kaifong Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20"
                />
              </div>

              <form className="w-full max-w-sm mx-auto" onSubmit={LoginForm}>
                <div className="mb-5 relative flex items-center">
                  <span className="absolute left-4 text-gray-400 text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-3 border border-black rounded-2xl text-gray-700 placeholder-gray-500 focus:outline-none focus:border-primary"
                    id="username"
                    type="text"
                    placeholder="อีเมล / หมายเลขโทรศัพท์"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-4 relative flex items-center">
                  <span className="absolute left-4 text-gray-400 text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-3 border border-black rounded-2xl text-gray-700 placeholder-gray-500 focus:outline-none focus:border-primary"
                    id="password"
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="mb-4 text-sm text-red-500">{error}</div>
                )}

                <div className="text-right mb-10">
                  <a className="text-sm font-bold text-gray-700 hover:text-primary" href="#">
                    Forgot password
                  </a>
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                  <button
                    type="submit"
                    className="inline-flex w-40 items-center justify-center rounded-full bg-yellow-400 px-6 py-3 font-bold text-gray-800 transition-colors hover:bg-yellow-500 cursor-pointer"
                  >
                    เข้าสู่ระบบ
                  </button>
                </div>
              </form>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}