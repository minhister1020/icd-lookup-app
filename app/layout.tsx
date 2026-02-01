import type { Metadata } from "next";
import { DM_Sans, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Clinical Clarity Typography System
 * ===================================
 *
 * DM Sans: Display font for headings - clean, modern geometric sans-serif
 * Source Sans 3: Body font for UI text - optimized for readability
 * JetBrains Mono: Monospace font for code/ICD codes - developer-friendly
 */

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * Metadata Configuration
 * ======================
 * 
 * This metadata is used by Next.js to set:
 * - Browser tab title
 * - Search engine descriptions (SEO)
 * - Social media preview cards
 * 
 * You can add more fields like:
 * - keywords: ['icd-10', 'medical', 'codes']
 * - openGraph: { image: '/preview.png' }
 * - twitter: { card: 'summary_large_image' }
 */
export const metadata: Metadata = {
  title: "MedCodeMap - ICD-10 Code Lookup",
  description: "Search and explore ICD-10 medical diagnosis codes, related drugs, and clinical trials. A professional clinical dashboard for healthcare coding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${sourceSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
