export const EXPERIMENT_SLUGS = ["paw", "hoot"] as const;

export type ExperimentSlug = (typeof EXPERIMENT_SLUGS)[number];

export interface ExperimentMeta {
  slug: ExperimentSlug;
  sticky?: boolean;
  ready: boolean;
}

export const EXPERIMENTS: ExperimentMeta[] = [
  { slug: "paw", sticky: true, ready: true },
  { slug: "hoot", ready: true },
];

export function isExperimentSlug(value: string): value is ExperimentSlug {
  return (EXPERIMENT_SLUGS as readonly string[]).includes(value);
}
