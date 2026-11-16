import type { Metadata } from "next";
import { Poppins, Instrument_Serif, Noto_Sans_Arabic } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { IntroLoader } from "@/components/motion/intro-loader";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { MobileQuickBar } from "@/components/layout/mobile-quick-bar";
import { THEME_SCRIPT } from "@/lib/theme";
import { LOCALE_SCRIPT } from "@/i18n/script";
import { LocaleCurtain } from "@/components/i18n/locale-curtain";
import { DomTranslator } from "@/components/i18n/dom-translator";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

// Arabic: Noto Sans Arabic for the Arabic script, Poppins still drawing Latin names and numbers
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  // Upright for display headings (The Journey), italic for accents and quotes.
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AirGuard Health | Innovative Chairside Protection",
  description:
    "Chairside protection devices for dental professionals and their patients.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // globals.css sets smooth scrolling; Next turns it off during route changes
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${notoArabic.variable} ${instrumentSerif.variable} h-full antialiased`}
      // The theme script adds `dark` before React loads.
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved (or system) theme before first paint, so dark mode never flashes white. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* The saved language (and right-to-left for Arabic) before first paint */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
        {/* The intro plays once per session: mark a repeat visit before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(sessionStorage.getItem('ag-intro-seen'))document.documentElement.classList.add('ag-intro-seen')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ScrollProgress />
        <IntroLoader logoSrc="/images/brand/airguard-logo-blue.png" className="flex flex-1 flex-col">
          <Header />
          <main tabIndex={-1} className="flex-1 outline-none">{children}</main>
          <Footer />
        </IntroLoader>
        {/* Phones: buy / ask / call, always one tap away */}
        <MobileQuickBar />
        <CartDrawer />
        <LocaleCurtain />
        <DomTranslator />
      </body>
    </html>
  );
}
