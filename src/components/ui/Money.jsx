export function money(n, symbol = '₹') {
  const v = Number(n) || 0;
  return `${symbol}${v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function Money({ value, symbol = '₹', className = '' }) {
  return <span className={`tabular-nums ${className}`}>{money(value, symbol)}</span>;
}
