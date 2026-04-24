"use client";

import { useEffect } from "react";
import { captureFirstTouch } from "@/lib/utm";

/** Invisible component — captures UTMs + referrer + landing page on first visit. */
export function UTMCapture() {
  useEffect(() => {
    captureFirstTouch();
  }, []);

  return null;
}
