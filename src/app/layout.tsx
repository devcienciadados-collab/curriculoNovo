import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "../styles/globals.css";

import { setDefaultOptions } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { ClientProviders } from "@/components/shared/client-providers";

const fontSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });
const fontTitle = Nunito({ subsets: ["latin"], variable: "--font-title" });

export const metadata: Metadata = {
  title: {
    default: "cvlaunch: Crie seu currículo de forma fácil e gratuita",
    template: "%s | cvlaunch",
  },
  description:
    "Crie currículos profissionais de forma rápida e fácil com nossos modelos gratuitos. O cvlaunch ajuda você a se destacar no mercado de trabalho.",
  keywords: [
    "criador de currículos",
    "gerador de currículos",
    "currículo online",
    "modelos de currículo",
    "currículo grátis",
    "cvlaunch",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "cvlaunch: Crie seu currículo de forma fácil e gratuita",
    description:
      "Crie currículos profissionais de forma rápida e fácil com nossos modelos gratuitos.",
    url: "https://cvlaunch.example.com",
    siteName: "cvlaunch",
    images: [
      {
        url: "https://cvlaunch.example.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

setDefaultOptions({ locale: ptBR });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontTitle.variable,
          fontSans.variable
        )}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
