import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Transient positions only: filters remain shareable in the URL.
const positions = new Map();
export default function useResultsScroll(ready) {
  const { pathname, search, hash, state } = useLocation();
  const continuing = Boolean(state?.pendingAction || state?.savedAction);
  const url = `${pathname}${search}${hash}`;
  useEffect(() => {
    if (!ready) return;
    const position = positions.get(url);
    const save = () => {
      positions.delete(url);
      positions.set(url, window.scrollY);
      if (positions.size > 20) positions.delete(positions.keys().next().value);
    };
    // Wait until Home has content and the route's default scroll has run.
    const frame = requestAnimationFrame(() => {
      if (position !== undefined && !hash && !continuing)
        window.scrollTo({ top: position, behavior: "instant" });
      window.addEventListener("scroll", save, { passive: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
    };
  }, [url, hash, ready, continuing]);
}
