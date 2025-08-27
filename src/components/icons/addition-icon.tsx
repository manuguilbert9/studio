
import * as React from "react"
import { type SVGProps } from "react"

export function AdditionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
      <rect x={3} y={3} width={18} height={18} rx={2} strokeDasharray="2 2" />
    </svg>
  )
}
