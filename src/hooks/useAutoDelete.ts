import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks time remaining (up to exactly 1 hour)
 * and automatically revokes the generated Object URL and triggers
 * a cleanup callback when the timer hits zero.
 */
export function useAutoDelete(
  fileUrl: string | null,
  onExpire: () => void,
  timeoutMs: number = 3600000 // 1 hour
) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!fileUrl) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(timeoutMs);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1000) {
          clearInterval(interval);
          URL.revokeObjectURL(fileUrl);
          onExpire();
          return null;
        }
        return prev ? prev - 1000 : null;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      // Optional: Clean up immediately if component unmounts to save RAM
      URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl, timeoutMs, onExpire]);

  return timeLeft;
}

export function formatTimeLeft(ms: number | null): string {
  if (ms === null) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
