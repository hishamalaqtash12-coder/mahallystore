"use client";

import { useEffect } from "react";

export default function LocaleDirectionSetter() {
  const locale = "ar";
  const dir = "rtl";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
      document.body.dir = dir;
      document.documentElement.classList.toggle("rtl", true);
      document.documentElement.classList.toggle("ltr", false);
    }
  }, []);

  return null;
}
