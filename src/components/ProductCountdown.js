"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function ProductCountdown({ endDate }) {
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

        return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
      }
      return "";
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!mounted || !endDate) return null;

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 text-[#be374f] font-medium text-[13px] bg-[#be374f]/10 px-2.5 py-1 rounded-sm w-fit">
      <Clock size={14} />
      <span>Ends in: {timeLeft}</span>
    </div>
  );
}
