import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVisiblePageNumbers } from '../utils/pagination';
import { scrollToTop } from '../utils/scrollToTop';

function PageButton({ page, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-label={`Page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-1.5 sm:min-w-[2.25rem] sm:h-9 sm:px-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold tabular-nums transition-all ${
        isActive
          ? 'bg-[#fdf6e3] text-[#876719] ring-1 sm:ring-2 ring-[#d4af37]/45 shadow-sm'
          : 'bg-white text-gray-700 border border-[#ebe4d8] hover:bg-[#faf7f2] hover:border-[#d4af37]/40'
      }`}
    >
      {page}
    </button>
  );
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  showingFrom,
  showingTo,
  onPageChange,
  itemLabel = 'appointments',
}) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);

  const handlePageChange = (page) => {
    if (page === currentPage) return;
    onPageChange(page);
    scrollToTop();
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-2 sm:pt-4">
      <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
        Showing{' '}
        <span className="font-semibold text-[#876719] tabular-nums">{showingFrom}</span>
        –
        <span className="font-semibold text-[#876719] tabular-nums">{showingTo}</span>
        {' '}of{' '}
        <span className="font-semibold text-[#876719] tabular-nums">{totalItems}</span>
        {' '}{itemLabel}
      </p>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg border border-[#ebe4d8] bg-white text-gray-700 hover:bg-[#faf7f2] hover:border-[#d4af37]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {visiblePages.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex items-center justify-center min-w-[1.5rem] sm:min-w-[1.75rem] h-8 sm:h-9 px-0.5 sm:px-1 text-xs sm:text-sm font-medium text-gray-400 select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <PageButton
              key={item}
              page={item}
              isActive={item === currentPage}
              onClick={handlePageChange}
            />
          )
        )}

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg border border-[#ebe4d8] bg-white text-gray-700 hover:bg-[#faf7f2] hover:border-[#d4af37]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
