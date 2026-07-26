import type { Metadata } from "next";
import LabHub from "./lab-hub";

export const metadata: Metadata = {
  title: "Lab — KeksOwl",
  description: "Interactive lab — Paw Rush, Hoot Stack, and small experiments.",
  openGraph: {
    title: "Lab — KeksOwl",
    description: "Interactive lab. Paw Rush and Hoot Stack.",
    url: "https://keksowl.com/lab",
    type: "website",
  },
};

export default function LabPage() {
  return <LabHub />;
}
