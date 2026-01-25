import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  title: "Bobby's ICD Mind Map Tool",
  description: "Search and explore ICD-10 medical condition codes. A learning project for understanding medical coding systems and React development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
