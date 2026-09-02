import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAFE LABOUR PAYMENT MANAGER | SAFE SOLUTIONS',
  description: 'House of Construction Solutions - Office Labour Payment & Ledger Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F4F0E8] text-slate-800">
        {children}
      </body>
    </html>
  );
}
