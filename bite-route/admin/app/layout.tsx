import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bite Route Admin',
  description: 'Owner and staff dashboard for Bite Route.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
