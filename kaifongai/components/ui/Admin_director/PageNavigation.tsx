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
  const startPage = Math.min(
  Math.max(1, currentPage - 1),
  Math.max(1, totalPages - 2)
)

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

      {Array.from(
        { length: Math.min(3, totalPages) },
        (_, index) => {
          const page = startPage + index

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

          {startPage + 2 < totalPages && (
      <>
        <span className="mx-1 px-2 py-1 text-gray-500">
          ...
        </span>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          className={`mx-1 px-3 py-1 rounded-md font-medium ${
            currentPage === totalPages
              ? "bg-accent text-[#333847]"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          {totalPages}
        </button>
      </>
    )}

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