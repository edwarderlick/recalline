import type { Metadata } from "next";
import { Chrome } from "@/components/Chrome";
import { WalletProvider } from "@/lib/WalletContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecallLine",
  description: "Parametric FDA recall cover on GenLayer Studio Next (61997).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-body-md text-on-surface antialiased">
        <WalletProvider>
          <Chrome>{children}</Chrome>
        </WalletProvider>
      </body>
    </html>
  );
}
