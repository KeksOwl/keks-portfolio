import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import LocaleProvider from "@/components/locale-provider/locale-provider";
import { Header, Footer } from "@/components";
import Decorations from "@/components/decorations/decorations";
import "../styles/normalize.css";
import "../styles/global.scss";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "KeksOwl — Semyon Ulankov",
  description: "Frontend Engineer focused on interactive UI, product thinking and engineering quality.",
  metadataBase: new URL("https://keksowl.com"),
  openGraph: {
    title: "KeksOwl — Semyon Ulankov",
    description: "Frontend Engineer focused on interactive UI, product thinking and engineering quality.",
    url: "https://keksowl.com",
    siteName: "KeksOwl",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.png", width: 600, height: 800, alt: "KeksOwl — its meow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KeksOwl — Semyon Ulankov",
    description: "Frontend Engineer focused on interactive UI, product thinking and engineering quality.",
    images: ["/og-image.png"],
  },
};

const localeScript = `(function(){try{var l=localStorage.getItem('locale');if(l!=='en'&&l!=='ru'){l=navigator.language.startsWith('ru')?'ru':'en'}document.documentElement.setAttribute('data-locale',l)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={ibmPlexSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
      </head>
      <body>
        <LocaleProvider>
          <div className="body">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
          <Decorations />
        </LocaleProvider>
      </body>
    </html>
  );
}
