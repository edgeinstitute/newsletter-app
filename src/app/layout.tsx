import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { getPublicSupabaseConfig } from "@/lib/supabase/dynamic";

const outfit = Outfit({
  variable: "--font-sans-family",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EDGE",
  description: "Platformă de administrare echipă",
};

const themeInitScript = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (_) {}
})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { url, anonKey } = await getPublicSupabaseConfig();

  return (
    <html lang="ro" className={`${outfit.variable} ${dmSerif.variable} h-full antialiased`}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full bg-surface text-foreground">
        <ThemeProvider>
          <SupabaseProvider url={url} anonKey={anonKey}>
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
