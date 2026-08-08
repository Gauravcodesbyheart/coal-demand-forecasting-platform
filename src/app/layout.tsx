import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoalSense AI — Intelligent Coal Demand Forecasting",
  description:
    "AI-powered decision-support platform for coal demand forecasting, production planning & inventory management at CCL.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-coal-950 text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
