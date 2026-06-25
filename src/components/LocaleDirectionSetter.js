"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function LocaleDirectionSetter() {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
      document.body.dir = dir;
      document.documentElement.classList.toggle("rtl", dir === "rtl");
      document.documentElement.classList.toggle("ltr", dir === "ltr");
    }
  }, [locale, dir]);

  return null;
}
