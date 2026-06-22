import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

// Fraunces: variable-weight optical serif for display headings.
// "opsz" axis gives it more personality at large sizes.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

// DM Sans: humanist grotesque — clear at body sizes, not Inter.
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'VerifiedReviews',
    template: '%s — VerifiedReviews',
  },
  description:
    'On-chain reviews gated by a real purchase receipt. No fakes. No incentivised posts.',
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="font-sans bg-paper text-ink min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
