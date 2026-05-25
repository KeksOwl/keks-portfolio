import { Header, Footer } from "@/components";

export type Locale = "en" | "ru";

const locales: Locale[] = ["en", "ru"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "en";

  return (
    <div className="body" lang={locale}>
      <Header locale={locale} />
      <main>{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
