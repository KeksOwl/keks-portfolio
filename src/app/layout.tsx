import { IBM_Plex_Sans } from "next/font/google";
import "../styles/normalize.css";
import "../styles/global.scss";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={ibmPlexSans.variable}>
      <body>{children}</body>
    </html>
  );
}
