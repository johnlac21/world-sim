// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GameLayout } from '@/components/layout/GameLayout';

export const metadata: Metadata = {
  title: 'World Sim BBGM',
  description: 'World simulation game inspired by Basketball GM',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GameLayout>{children}</GameLayout>
      </body>
    </html>
  );
}
