import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { CartProvider, CartDrawer } from '@/lib/cart';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MarketNet — La marketplace locale en RDC',
  description: 'Découvrez et achetez auprès des boutiques locales. MarketNet connecte les commerçants d\'Afrique avec leurs clients.',
  keywords: 'marketplace, RDC, Congo, boutique en ligne, commerce local, acheter en ligne',
  openGraph: {
    title: 'MarketNet — La marketplace locale en RDC',
    description: 'Découvrez et achetez auprès des boutiques locales.',
    type: 'website',
    locale: 'fr_CD',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakartaSans.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
