export default function AuthPageLayout({ children, maxWidth = 'max-w-md' }) {
  return (
    <div className="flex flex-1 flex-col w-full min-h-0 overflow-hidden bg-gradient-to-br from-[#faf7f2] via-[#f5efe6] to-[#fdfbf7]">
      <div
        data-scroll-root
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        <div className="flex min-h-full items-center justify-center px-3 py-3 sm:px-6 sm:py-6">
          <div className={`w-full ${maxWidth} mx-auto`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
