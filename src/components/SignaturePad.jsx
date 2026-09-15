import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

function pointFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

const SignaturePad = forwardRef(function SignaturePad({ className = '', height = 160 }, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  const sizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round((rect.height || height) * dpr));
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    const snapshot = canvas.width && canvas.height ? canvas.toDataURL() : null;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1c2430';
    ctx.lineWidth = 2.2 * dpr;
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = snapshot;
    }
  };

  useEffect(() => {
    sizeCanvas();
    const canvas = canvasRef.current;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => sizeCanvas()) : null;
    if (canvas && observer) observer.observe(canvas);
    window.addEventListener('resize', sizeCanvas);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', sizeCanvas);
    };
  }, []);

  const start = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    drawing.current = true;
    last.current = pointFromEvent(event, canvas);
  };

  const move = (event) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    const next = pointFromEvent(event, canvas);
    const prev = last.current || next;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    last.current = next;
  };

  const end = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    drawing.current = false;
    last.current = null;
    try {
      canvasRef.current?.releasePointerCapture?.(event.pointerId);
    } catch {
      /* already released */
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  useImperativeHandle(ref, () => ({
    toDataURL: (...args) => canvasRef.current?.toDataURL(...args) || '',
    clear,
    isEmpty: () => {
      const canvas = canvasRef.current;
      if (!canvas) return true;
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) return false;
      }
      return true;
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      height={height}
      className={`w-full h-40 border border-line rounded-lg bg-white touch-none cursor-default ${className}`.trim()}
      style={{ touchAction: 'none' }}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    />
  );
});

export default SignaturePad;
