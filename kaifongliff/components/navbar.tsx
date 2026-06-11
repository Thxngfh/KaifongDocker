"use client"
import React from 'react'
import Image from "next/image"
import KaifongLogo from "../public/logo/Kaifong_logo2.png"
import '../app/globals.css'

const navbar = () => {
  return (
    <div>
            <nav className="flex items-center space-x-2 top-0 left-0 z-40 h-16 w-full bg-foreground3 shadow-xs px-6">
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
