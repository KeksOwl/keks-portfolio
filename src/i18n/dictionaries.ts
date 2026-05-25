import type { Locale } from "@/app/[locale]/layout";

const commonDictionaries = {
  en: () => import("./common.en.json").then((m) => m.default),
  ru: () => import("./common.ru.json").then((m) => m.default),
};

export const getCommonDictionary = (locale: Locale) =>
  commonDictionaries[locale]();

export type CommonDictionary = Awaited<ReturnType<typeof getCommonDictionary>>;
