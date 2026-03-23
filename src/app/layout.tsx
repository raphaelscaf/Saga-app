import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAGA — RPG Pessoal",
  description: "Gamifique sua vida com IA. Missoes, XP e evolucao real.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.14 0.015 260)",
              border: "1px solid oklch(0.78 0.14 195 / 0.3)",
              color: "oklch(0.95 0.005 210)",
            },
          }}
        />
      </body>
    </html>
  );
}
