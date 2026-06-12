"use client"

import { IoIosArrowBack } from "react-icons/io"

type ComplaintPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function ComplaintPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ComplaintPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center mt-6 mr-12 text-gray-500 gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={`flex items-center justify-center p-2 rounded-md ${
          currentPage === 1
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-gray-100"
        }`}
      >
        <IoIosArrowBack />
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`mx-1 px-3 py-1 rounded-md font-medium ${
              currentPage === page
                ? "bg-accent text-[#333847]"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center p-2 rounded-md ${
          currentPage === totalPages
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-gray-100"
        }`}
      >
        <IoIosArrowBack className="rotate-180" />
      </button>
    </div>
  )
}