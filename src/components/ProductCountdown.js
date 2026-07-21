"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useLocale } from "next-intl";

export default function ProductCountdown({ endDate }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [timeLeft, setTimeLeft] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    let targetDate = endDate ? new Date(endDate) : null;

    if (!targetDate || isNaN(targetDate.getTime()) || targetDate.getTime() < new Date().getTime()) {
      setTimeLeft("");
      return;
    }

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const hStr = hours.toString().padStart(2, '0');
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');

        if (isAr) {
          return `${hStr}س : ${mStr}د : ${sStr}ث`;
        }
        return `${hStr}h : ${mStr}m : ${sStr}s`;
      }
      return "";
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, isAr]);

  if (!mounted || !endDate) return null;
  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full w-fit">
      <Clock size={13} className="text-rose-600 animate-pulse" />
      <span>{isAr ? `ينتهي خلال: ${timeLeft}` : `Ends in: ${timeLeft}`}</span>
    </div>
  );
}
