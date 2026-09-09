export const APPOINTMENTS_PAGE_SIZE = 5;

export function getPaginationMeta(items, page, pageSize = APPOINTMENTS_PAGE_SIZE) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * pageSize;

  return {
    paginatedItems: items.slice(offset, offset + pageSize),
    totalItems,
    totalPages,
    currentPage,
    showingFrom: totalItems === 0 ? 0 : offset + 1,
    showingTo: Math.min(offset + pageSize, totalItems),
  };
}

/** Max 5 page boxes when totalPages > 5 */
export function getVisiblePageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const addEllipsis = (result) => {
    if (result.length > 0 && result[result.length - 1] !== 'ellipsis') {
      result.push('ellipsis');
    }
  };

  // First 3 pages: show 1–3 (+ next when on page 3), then last
  if (currentPage <= 3) {
    const result = [1, 2, 3];
    if (currentPage === 3) result.push(4);
    addEllipsis(result);
    result.push(totalPages);
    return result;
  }

  // Last 3 pages: show first, then last 4 pages ending at total
  if (currentPage >= totalPages - 2) {
    const result = [1];
    addEllipsis(result);
    const start = totalPages - 3;
    for (let page = start; page <= totalPages; page += 1) {
      if (page > 1) result.push(page);
    }
    return result;
  }

  // Middle: first, prev + current + next, last
  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ];
}
