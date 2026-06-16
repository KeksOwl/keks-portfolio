import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
    additionalData: `@use "variables" as *;`,
  },
};

export default nextConfig;
