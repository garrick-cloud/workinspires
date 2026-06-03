// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { DashboardProvider } from '@/context/DashboardContext'; // Ensure this path is correct!

export const metadata: Metadata = {
  title: "Workinspires - Training Performance Evaluation Platform",
  description: "Dynamic Training Performance Evaluation Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans bg-[#0f172a] text-[#f1f5f9]">
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}