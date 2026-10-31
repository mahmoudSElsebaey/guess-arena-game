import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guess Arena",
  description: "A real-time multiplayer character guessing game."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
