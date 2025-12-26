import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppContent } from "@/components/app-content";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GlamPack - Warehouse Management System",
  description: "Professional warehouse and supply chain management system",
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <AppContent>
            {children}
          </AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
