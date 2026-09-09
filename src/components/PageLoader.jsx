import Loader from './Loader';

export default function PageLoader({
  message = 'Loading...',
  size = 'lg',
  className = '',
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-full text-center ${
        compact ? 'py-10 min-h-[10rem]' : 'flex-1 py-16 min-h-[14rem]'
      } ${className}`}
    >
      <Loader size={size} />
      {message ? (
        <p className="mt-4 text-sm font-medium text-[#876719] tracking-wide">{message}</p>
      ) : null}
    </div>
  );
}
