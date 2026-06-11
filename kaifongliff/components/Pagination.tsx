"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      role="navigation"
      aria-label="pagination"
      className="flex items-center justify-center gap-4 pt-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={`inline-flex h-12 w-12 items-center justify-center rounded-md ${
          currentPage === 1 ? "cursor-not-allowed opacity-40" : "hover:bg-accent"
        }`}
        aria-label="หน้าก่อนหน้า"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const isActive = currentPage === page;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-md px-2.5 text-sm font-medium ${
              isActive
                ? "bg-nt text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`inline-flex h-12 w-12 items-center justify-center rounded-md ${
          currentPage === totalPages
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-accent"
        }`}
        aria-label="หน้าถัดไป"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}