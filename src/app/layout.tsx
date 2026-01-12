import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import "../../global.css";
import { ExitShareModal } from "@/components/features/ExitShareModal";
import { InstallAppPrompt } from "@/components/features/InstallAppPrompt";
import { PwaRouteRestore } from "@/components/features/PwaRouteRestore";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kingbloggers.com";

export const metadata: Metadata = {
  title: {
    default: "King Bloggers — Tech, Art, Culture & Power",
    template: "%s — King Bloggers",
  },
  description:
    "A sovereign Nigerian media platform for Tech, Art & Culture, Entertainment, Politics, Economics, and Religion. Read, write, and share stories that matter.",
  keywords: [
    "King Bloggers",
    "Nigerian blog",
    "Nigerian media",
    "Tech blog Nigeria",
    "Art and Culture",
    "Politics Nigeria",
    "Entertainment",
    "Economics",
    "Religion",
    "African stories",
  ],
  authors: [{ name: "King Bloggers", url: APP_URL }],
  creator: "King Bloggers",
  publisher: "King Bloggers",
  applicationName: "King Bloggers",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: APP_URL,
    siteName: "King Bloggers",
    title: "King Bloggers — Tech, Art, Culture & Power",
    description:
      "A sovereign Nigerian media platform for Tech, Art & Culture, Entertainment, Politics, Economics, and Religion.",
    images: [
      {
        url: `${APP_URL}/icons/og.png`,
        width: 1200,
        height: 630,
        alt: "King Bloggers — Tech, Art, Culture & Power",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@king_bloggers",
    creator: "@king_bloggers",
    title: "King Bloggers — Tech, Art, Culture & Power",
    description: "A sovereign Nigerian media platform for stories that matter.",
    images: [`${APP_URL}/icons/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL(APP_URL),
};

export const viewport: Viewport = {
  themeColor: "#FF8C00",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <PwaRouteRestore />
          </Suspense>
          {children}
          <Suspense fallback={null}>
            <InstallAppPrompt />
          </Suspense>
          <Suspense fallback={null}>
            <ExitShareModal />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
