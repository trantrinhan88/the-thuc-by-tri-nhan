import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thể thức văn bản – Nghị định 30",
  description: "Soạn thảo văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
