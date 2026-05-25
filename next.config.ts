import type { NextConfig } from "next";
import path from "path";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
    additionalData: `@use "variables" as *;`,
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
