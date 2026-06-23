"use client"
import React from 'react'
import Image from "next/image"
import KaifongLogo from "../public/logo/Kaifong_logo2.png"
import '../app/globals.css'
import { useRouter } from 'next/navigation'
import { IoArrowBack } from 'react-icons/io5'

interface NavbarProps {
  showBackButton?: boolean;
}

const navbar = ({ showBackButton = false }: NavbarProps) => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div>
            <nav className="flex items-center space-x-2 top-0 left-0 z-40 h-16 w-full bg-foreground3 shadow-xs px-6">
                {showBackButton && (
                  <button
                    onClick={handleBack}
                    className="text-[#1A1A2E] text-2xl hover:opacity-70 transition duration-200 mr-4 cursor-pointer"
                    aria-label="Go back"
                  >
                    <IoArrowBack />
                  </button>
                )}
                <Image
                    src={KaifongLogo}
                    alt="KaifongLogo"
                    className="w-12 h-auto"
                />
                <h5 className="text-[#1A1A2E] font-bold text-lg">KaiFong AI</h5>
            </nav>
    </div>
  )
}

export default navbar
