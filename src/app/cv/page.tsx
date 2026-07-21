import type { Metadata } from "next";
import CvView from "./cv-view";

export const metadata: Metadata = {
  title: "CV — Semyon Ulankov",
  description:
    "CV of Semyon Ulankov — Frontend Engineer: polished product UI, component architecture, developer tooling, and senior-level expertise in i18n infrastructure.",
  openGraph: {
    title: "CV — Semyon Ulankov",
    description:
      "Frontend Engineer — product UI, i18n infrastructure, developer tooling. Component architecture, static analysis in CI, A/B experiments at Songsterr.",
    url: "https://keksowl.com/cv",
    type: "profile",
  },
};

export default function CvPage() {
  return <CvView />;
}
