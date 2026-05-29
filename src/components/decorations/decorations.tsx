"use client";

import dynamic from "next/dynamic";

const DotGrid = dynamic(() => import("@/components/dot-grid/dot-grid"), { ssr: false });
const CatPaw = dynamic(() => import("@/components/cat-paw/cat-paw"), { ssr: false });
const CornerCat = dynamic(() => import("@/components/corner-cat/corner-cat"), { ssr: false });

export default function Decorations() {
  return (
    <>
      <DotGrid />
      <CatPaw />
      <CornerCat />
    </>
  );
}
