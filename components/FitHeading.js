'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// Shrinks its own font-size (rather than wrapping or truncating with an
// ellipsis) until the text fits on one line within the available width —
// course titles vary a lot in length and the container width changes per
// breakpoint, so a fixed set of responsive text-size classes can't
// guarantee a fit for every combination.
export default function FitHeading({ text, className, maxFontSize = 36, minFontSize = 14 }) {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function fit() {
      let size = maxFontSize;
      el.style.fontSize = `${size}px`;
      while (el.scrollWidth > el.clientWidth && size > minFontSize) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
      setFontSize(size);
    }

    fit();
    // Observe the parent, not the heading itself — shrinking the heading's
    // own font-size changes its height, which would re-trigger a resize
    // observer watching the heading and loop. The parent's width is what
    // actually determines the fit and doesn't move when the font shrinks.
    const target = el.parentElement ?? el;
    const ro = new ResizeObserver(fit);
    ro.observe(target);
    return () => ro.disconnect();
  }, [text, maxFontSize, minFontSize]);

  return (
    <h1 ref={ref} className={className} style={{ fontSize, whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {text}
    </h1>
  );
}
