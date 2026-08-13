'use client';

import { useEffect, useRef, useState } from 'react';

// A minimal canvas-based e-signature pad: draw with mouse/touch/pen, export
// as a PNG data URL on every stroke, with a Clear button. Pre-loads a
// previously saved signature (if any) so the user sees what's on file.
export default function SignaturePad({ value, onChange, signedAt, height = 160 }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#241c0a';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
    // Only load the saved signature once, on mount — not on every
    // re-render, so it doesn't stomp on a signature the user is mid-way
    // through redrawing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pointFromEvent(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(e);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    setIsEmpty(false);
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange?.(canvasRef.current.toDataURL('image/png'));
  }

  function handleClear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.(null);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-brand-blue/20 bg-white dark:bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          className="w-full touch-none"
          style={{ height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-brand-ink/50">
        <span>
          {isEmpty
            ? 'Sign above with your mouse, trackpad, or finger'
            : signedAt
              ? `Signed ${new Date(signedAt).toLocaleDateString()}`
              : 'Signature captured — remember to save'}
        </span>
        <button type="button" onClick={handleClear} className="font-medium text-brand-blue hover:underline">
          Clear
        </button>
      </div>
    </div>
  );
}
