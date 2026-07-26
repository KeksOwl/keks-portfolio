"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/components/locale-provider/locale-provider";
import type { ExperimentSlug } from "../experiments";
import LabNav from "../lab-nav";
import styles from "../lab.module.scss";
import en from "../lab.en.json";
import ru from "../lab.ru.json";

const dicts = { en, ru };

const viewBySlug: Record<ExperimentSlug, React.ComponentType> = {
  paw: dynamic(() => import("../experiments/paw"), { ssr: false }),
  hoot: dynamic(() => import("../experiments/hoot"), { ssr: false }),
};

interface ExperimentViewProps {
  slug: ExperimentSlug;
}

export default function ExperimentView({ slug }: ExperimentViewProps) {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const copy = dict.experiments[slug];
  const View = viewBySlug[slug];

  return (
    <section className="container">
      <LabNav />
      <header className={styles.experimentHead}>
        <h1 className={styles.experimentTitle}>{copy.title}</h1>
        <p className={styles.experimentBlurb}>{copy.blurb}</p>
      </header>
      <View />
    </section>
  );
}
