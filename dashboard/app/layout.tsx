import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventTracker Dashboard',
  description: 'Real-time session analytics and click heatmaps',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
