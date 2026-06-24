import "./globals.css";
import type { Metadata, Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Geist_Mono } from "next/font/google";
import { PwaBootstrap } from "@/components/pwa/pwa-bootstrap";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { FloatingChatButton } from "@/components/chat/floating-chat-button";
import {
  getAppMetadata,
  getFaviconUrl,
  generateCssVariables,
  getCustomCss,
  getPublicSystemSettings,
} from "@/lib/settings-utils";

const cairo = Cairo({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateViewport(): Promise<Viewport> {
  const settings = await getPublicSystemSettings();

  return {
    themeColor: settings.appearance.primaryColor || "#3b82f6",
    colorScheme: "light dark",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getAppMetadata();
  const faviconUrl = await getFaviconUrl();
  const fallbackIcons = [
    {
      url: "/pwa-icons/192",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/pwa-icons/512",
      sizes: "512x512",
      type: "image/png",
    },
  ];

  return {
    ...metadata,
    manifest: "/manifest.webmanifest",
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      title:
        typeof metadata.title === "string"
          ? metadata.title
          : metadata.applicationName,
      statusBarStyle: "default",
    },
    icons: {
      icon: faviconUrl ? [faviconUrl, ...fallbackIcons] : fallbackIcons,
      shortcut: faviconUrl || "/pwa-icons/192",
      apple: faviconUrl || "/pwa-icons/192",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSystemSettings();
  const customCss = await getCustomCss();
  const cssVariables = generateCssVariables(settings.appearance);

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <PlausibleProvider
            domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            customDomain={process.env.NEXT_PUBLIC_PLAUSIBLE_CUSTOM_DOMAIN}
            selfHosted={Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_CUSTOM_DOMAIN)}
          />
        ) : null}
        {/* Inject CSS variables for brand colors */}
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
        {/* Inject custom CSS if defined */}
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      </head>
      <body
        className={`${cairo.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
      >
        <PwaBootstrap />
        <ThemeProvider>
          <SessionProvider>
            <SettingsProvider settings={settings}>
              {children}
              <FloatingChatButton />
              <Toaster />
            </SettingsProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
