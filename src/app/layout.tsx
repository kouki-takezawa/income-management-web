import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "年収管理アプリ",
  description: "給与・残業・賞与・有給休暇をまとめて管理する年収管理アプリ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-text-primary">{children}</body>
    </html>
  );
}
