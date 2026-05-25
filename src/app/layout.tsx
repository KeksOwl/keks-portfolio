import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import LocaleProvider from "@/components/locale-provider/locale-provider";
import { Header, Footer } from "@/components";
import "../styles/normalize.css";
import "../styles/global.scss";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "KeksOwl",
  description: "Frontend Engineer",
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
        </LocaleProvider>
      </body>
    </html>
  );
}
