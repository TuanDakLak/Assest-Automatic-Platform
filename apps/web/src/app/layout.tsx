import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Asset Factory - Premium Commercial Design Assets Automatically",
  description: "Generate highly customizable, commercial-grade digital design assets using scalable enterprise AI models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
