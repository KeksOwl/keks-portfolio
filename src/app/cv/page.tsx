import type { Metadata } from "next";
import CvView from "./cv-view";

export const metadata: Metadata = {
  title: "CV — Semyon Ulankov",
  description:
    "CV of Semyon Ulankov — Software Engineer: complex interactive product UI, frontend architecture (editor core, Web Workers, SVG), i18n infrastructure and A/B experiments at Songsterr.",
  openGraph: {
    title: "CV — Semyon Ulankov",
    description:
      "Software Engineer — interactive product UI, frontend architecture, i18n infrastructure. Editor core, Web Workers, A/B experiments at Songsterr.",
    url: "https://keksowl.com/cv",
    type: "profile",
  },
};

export default function CvPage() {
  return <CvView />;
}
