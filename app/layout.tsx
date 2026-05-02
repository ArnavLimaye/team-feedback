import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Team Feedback — Performance Review Platform',
  description: 'Bi-weekly performance feedback platform for engineering teams. Track scores, submit self-reviews, and monitor team progress.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
