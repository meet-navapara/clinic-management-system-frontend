export default function AuthPageLayout({ children, maxWidth = 'max-w-md' }) {
  return (
    <div className="relative flex flex-1 flex-col w-full min-h-0 overflow-hidden bg-canvas">
      <div data-scroll-root className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="flex min-h-full items-center justify-center px-4 py-6 sm:px-6">
          <div className={`w-full ${maxWidth} mx-auto`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
