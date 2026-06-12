import React from 'react'
import { CiCalendar } from 'react-icons/ci';
import { FaRegFileAlt, FaRegImage, FaRegTrashAlt } from 'react-icons/fa';
import { GoDatabase } from 'react-icons/go';
import { IoEyeOutline } from 'react-icons/io5';
import { MdOutlinePhoto, MdOutlinePictureAsPdf, MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiPencilLine } from 'react-icons/ri';
import { IBM_Plex_Mono } from "next/font/google";


const monoFont = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["100","200","300","400", "500", "700"],
})

type FileItem = {
  title: string
  description: string
  date: string
  datasize: string
  filetype?: string
  viewcount: string
  image?: string
}

type FileCardProps = {
  item: FileItem
}

const FileCard = ({ item }: FileCardProps) => {
  const isImage = item.filetype === "IMAGE";

  return (
    <div className="w-75 rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
      
      {/* IMAGE */}
      <div className="relative h-40 bg-[#4B5563]">
        <img
          src="https://images.unsplash.com/photo-1540553016722-983e48a2cd10"
          alt="card"
          className="w-full h-full object-cover opacity-60"
        />

        {/* badge */}
        <div
          className={`absolute top-3 right-3 text-white text-xs px-3 py-1 rounded-full ${
            isImage ? "bg-[#009688]" : "bg-[#BA1A1A]"
          }`}
        >
          {item.filetype ?? "FILE"}
        </div>
        
        {/*icon กลางรูป*/}
        <div className="absolute inset-0 flex items-center justify-center">
          {isImage && (
            <MdOutlinePhoto  className="text-[#009688] text-6xl opacity-50" />
          )}
          {
            !isImage && (
              <MdOutlinePictureAsPdf  className="text-[#BA1A1A] text-6xl opacity-40" />
            )
          }
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* title */}
        <h2 className="text-lg font-semibold text-[#161B29] line-clamp-2">
          {item.title}
        </h2>

        {/* description */}
        <p className="mt-2 text-sm text-[#575E72]/80 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* date + size */}
        <div className={` ${monoFont.className} mt-4 flex items-center gap-4 text-[13px] text-[#575E72]/80`}>
          <div className="flex items-center gap-1">
            <CiCalendar />
            <span>{item.date}</span>
          </div>

          <div className="flex items-center gap-1">
            <GoDatabase />
            <span>{item.datasize}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-4 pb-4">
        <hr className="mb-3 border-gray-200" />

        <div className="flex items-center justify-between text-sm text-[#575E72]/80">
          {/* view */}
          <div className="flex items-center gap-1">
            {/* <IoEyeOutline />
            <span>{item.viewcount}</span> */}
          </div>

          {/* actions */}
          <div className="flex items-center gap-3 text-lg text-[#161B29]">
            {/* <MdOutlineRemoveRedEye className="cursor-pointer hover:text-black" /> */}
            <RiPencilLine className="cursor-pointer hover:text-black hover:text-gray-500" />
            <FaRegTrashAlt className="cursor-pointer text-gray-400 hover:text-red-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileCard;
