"use client";
import { useState } from "react";
import { MdOutlineGridView } from "react-icons/md"
import SearchInput from "./SearchInput"
import { FaList } from "react-icons/fa6"

// const ChevronDown = ({ className = "w-4 h-4" }) => (
//   <svg
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     className={className}
//   >
//     <path d="M6 9l6 6 6-6" />
//   </svg>
// )
type Props = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
};

export default function ManualToolbar({
  search,
  setSearch,
}: Props){
  const [view, setView] = useState<"grid" | "list">("grid");


  return (
  <div className="w-full rounded-2xl bg-[#E6E8F0] p-4">
    <div className="flex items-center gap-4 w-full">

  <div className="flex-1">
    <SearchInput
      className="w-full"
      inputClassName="rounded-2xl py-3.5"
      placeholder="ค้นหาคู่มือหรือวิดีโอที่แนะนำ..."
      value={search}
      onChange={setSearch}    
      />
  </div>

    {/* dropdown */}
    {/* <div className="flex items-center justify-between rounded-xl bg-white px-6 py-3.5 text-gray-500 min-w-[160px]">
      <span></span>
      <ChevronDown />
    </div>

    <div className="flex items-center justify-between rounded-xl bg-white px-6 py-3.5 text-gray-500 min-w-[160px]">
      <span></span>
      <ChevronDown />
    </div> */}

    {/* toggle */}
    <div className="relative flex items-center rounded-xl bg-[#D9DCE8] p-1 gap-1 w-fit">
      {/* Animated background */}
      <div
        className={`absolute top-1 bottom-1 w-11 rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out
          ${view === "grid" ? "left-1" : "left-[48px]"}`}
      />

      {/* Grid Button */}
      <button
        onClick={() => setView("grid")}
        className="relative z-10 flex h-11 w-11 items-center justify-center rounded-lg"
      >
        <MdOutlineGridView
          className={`text-xl transition-colors duration-300 ${
            view === "grid" ? "text-[#7A5C00]" : "text-gray-500"
          }`}
        />
      </button>

      {/* List Button */}
      <button
        onClick={() => setView("list")}
        className="relative z-10 flex h-11 w-11 items-center justify-center rounded-lg"
      >
        <FaList
          className={`text-lg transition-colors duration-300 ${
            view === "list" ? "text-[#7A5C00]" : "text-gray-500"
          }`}
        />
      </button>
    </div>

  </div>
</div>
  )
}