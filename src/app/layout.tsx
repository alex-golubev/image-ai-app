import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { JSX, ReactNode } from 'react';
import { TRPCReactProvider } from '~/trpc/client';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'image AI',
  description: 'Image processing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <TRPCReactProvider>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </TRPCReactProvider>
    </html>
  );
}
