import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXPERIMENTS, isExperimentSlug, type ExperimentSlug } from "../experiments";
import ExperimentView from "./experiment-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const titles: Record<ExperimentSlug, string> = {
  paw: "Paw Rush",
  hoot: "Hoot Stack",
  crumb: "Crumb Match",
  trail: "Trail Tail",
};

export async function generateStaticParams() {
  return EXPERIMENTS.map((exp) => ({ slug: exp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isExperimentSlug(slug)) return {};
  const name = titles[slug];
  return {
    title: `${name} — Lab — KeksOwl`,
    description: `Interactive experiment: ${name} in the KeksOwl lab.`,
    openGraph: {
      title: `${name} — Lab — KeksOwl`,
      description: `Interactive experiment: ${name}.`,
      url: `https://keksowl.com/lab/${slug}`,
      type: "website",
    },
  };
}

export default async function LabExperimentPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isExperimentSlug(slug)) notFound();
  return <ExperimentView slug={slug} />;
}
