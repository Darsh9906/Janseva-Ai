import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import DemoBanner from "@/components/layout/DemoBanner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CivicAssistant from "@/components/chat/CivicAssistant";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JanSeva — Report. Track. Resolve.",
  description:
    "JanSeva is a simple way for communities to report local problems and track them through to resolution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <DemoBanner />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CivicAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
