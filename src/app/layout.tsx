import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lead Finder | 高確度のビジネスリードを特定",
  description: "ウェブサイトを持っていない地元のビジネスを見つけ、オンラインプレゼンスの向上を支援します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <div id="lead-finder-id" style={{ display: 'none' }}>LEAD_FINDER_OK</div>
        {children}
      </body>
    </html>
  );
}
