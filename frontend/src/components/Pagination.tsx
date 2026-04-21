interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: Array<number | string> = [];

    for (let i = 1; i <= totalPages; i++) {
      const shouldShow = i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1;
      if (!shouldShow && i !== 2 && i !== totalPages - 1) continue;
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Trước
      </button>

      {getPageNumbers().map((page, index, pages) => {
        if (typeof page !== 'number') return null;

        const previousPage = index > 0 ? pages[index - 1] : null;
        const needsEllipsis = typeof previousPage === 'number' && page - previousPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {needsEllipsis && <span className="px-2 text-gray-500">...</span>}
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 transition ${
                currentPage === page
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          </div>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Sau
      </button>

      <span className="ml-4 text-gray-600 font-medium">
        Trang {currentPage} / {totalPages}
      </span>
    </div>
  );
}
