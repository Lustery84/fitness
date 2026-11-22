import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitSnap — Tính calo qua ảnh, thực đơn giàu đạm & tập theo vùng",
  description:
    "Ứng dụng theo dõi calo qua ảnh món ăn, lập thực đơn tuần giàu đạm và kế hoạch tập luyện dựa trên bằng chứng khoa học.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={jakarta.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
