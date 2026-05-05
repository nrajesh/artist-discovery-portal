import type { SVGProps } from "react";

export function SiteBrandMark({ className = "h-6 w-6", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.7 5.25A7.95 7.95 0 1 0 16.9 18.6"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <path
        d="M18.75 7.6A7.85 7.85 0 0 1 20.05 12a7.85 7.85 0 0 1-1.42 4.55"
        stroke="#FEF3C7"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <path
        d="M12 7.35l1.32 3.33L16.65 12l-3.33 1.32L12 16.65l-1.32-3.33L7.35 12l3.33-1.32L12 7.35Z"
        fill="currentColor"
      />
      <path
        d="M6.4 7.9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="#FFF7ED"
      />
      <path
        d="M17.75 19.65a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3Z"
        fill="#451A03"
        fillOpacity=".28"
      />
    </svg>
  );
}
