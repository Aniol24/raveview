"use client";

import { useMemo } from "react";

type Props = {
  value: number; // 0.5..5
  onChange?: (v: number) => void;
  size?: number;
};

export function ReviewStars({ value, onChange, size = 28 }: Props) {
  const stars = useMemo(() => {
    const out: ("full" | "half" | "empty")[] = [];
    let remaining = value;
    for (let i = 0; i < 5; i++) {
      if (remaining >= 1) {
        out.push("full");
        remaining -= 1;
      } else if (remaining >= 0.5) {
        out.push("half");
        remaining -= 0.5;
      } else {
        out.push("empty");
      }
    }
    return out;
  }, [value]);

  const handleClick = (idx: number, half: boolean) => {
    if (!onChange) return;
    const newVal = half ? idx + 0.5 : idx + 1;
    onChange(newVal);
  };

  return (
    <div className="flex select-none">
      {stars.map((kind, i) => (
        <div key={i} className="relative" style={{ width: size, height: size }}>
          <button
            type="button"
            aria-label={`Set rating to ${i + 0.5}`}
            onClick={() => handleClick(i, true)}
            className="absolute inset-y-0 left-0 w-1/2"
            title={`${i + 0.5}`}
          />
          <button
            type="button"
            aria-label={`Set rating to ${i + 1}`}
            onClick={() => handleClick(i, false)}
            className="absolute inset-y-0 right-0 w-1/2"
            title={`${i + 1}`}
          />
          <Star kind={kind} size={size} />
        </div>
      ))}
    </div>
  );
}

function Star({ kind, size }: { kind: "full" | "half" | "empty"; size: number }) {
  const base = "fill-current";
  const active = "text-yellow-400";
  const inactive = "text-zinc-600";
  if (kind === "full") {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" className={`${base} ${active}`} aria-hidden>
        <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
      </svg>
    );
  }
  if (kind === "half") {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
          className="text-yellow-400"
          fill="url(#half)"
        />
        <path
          d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
          className="text-zinc-600"
          fill="currentColor"
          fillOpacity={0.4}
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={`${base} ${inactive}`} aria-hidden>
      <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
    </svg>
  );
}
