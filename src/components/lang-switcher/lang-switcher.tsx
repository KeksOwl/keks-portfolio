"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/app/[locale]/layout";

interface LangSwitcherProps {
  className: string,
  locale: Locale,
  label: string
}

export default function LangSwitcher({ className, locale, label }: LangSwitcherProps) {
  const pathname = usePathname();
  const targetLocale: Locale = locale === "en" ? "ru" : "en";
  const targetPath = pathname.replace(/^\/(en|ru)/, `/${targetLocale}`);

  return (
    <Link className={className} href={targetPath} lang={targetLocale}>
      {label}
    </Link>
  );
}
