import { useState, useEffect } from "react";

export function useOtpTimer(initial = 30) {
  const [time, setTime] = useState(initial);

  useEffect(() => {
    if (time === 0) return;

    const timer = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const reset = () => setTime(initial);

  return { time, reset };
}