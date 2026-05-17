"use client";

import nextDynamic from "next/dynamic";

export const DynamicMermaid = nextDynamic(
  () => import("./mermaid-diagram").then((m) => m.MermaidDiagram),
  { ssr: false }
);
