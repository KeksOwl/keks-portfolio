import type { Metadata } from "next";
import LabHub from "./lab-hub";

export const metadata: Metadata = {
  title: "Lab — KeksOwl",
  description: "Interactive lab — Paw Rush and more experiments to come.",
  openGraph: {
    title: "Lab — KeksOwl",
    description: "Interactive lab. Flagship: Paw Rush.",
    url: "https://keksowl.com/lab",
    type: "website",
  },
};

export default function LabPage() {
  return <LabHub />;
}
