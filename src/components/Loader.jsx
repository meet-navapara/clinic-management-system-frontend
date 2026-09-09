const SIZE_CLASSES = {
  sm: 'h-8 w-8 border-2',
  md: 'h-12 w-12 border-[3px]',
  lg: 'h-16 w-16 border-4',
};

export default function Loader({ size = 'md', className = '' }) {
  return (
    <div
      className={`rounded-full border-[#ebe4d8] border-t-[#c9a227] animate-spin ${SIZE_CLASSES[size]} ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    />
  );
}
