import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "RAVEVIEW",
  description: "Rate and review DJ sets – like Letterboxd for DJ sets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          <main className="min-h-dvh">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
