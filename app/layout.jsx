import './globals.css';
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Lotus365 Official Website - Lotus365 Games & Rewards in 2026',
  icons: {
    icon: [
      { url: '/assets/cropped-lotus365-official-logo-1-32x32.webp', sizes: '32x32' },
      { url: '/assets/cropped-lotus365-official-logo-1-192x192.webp', sizes: '192x192' },
    ],
    apple: '/assets/cropped-lotus365-official-logo-1-180x180.webp',
  },
};
export default function RootLayout({ children }) {
  return <html lang="en-US"><body className="ast-desktop ast-page-builder-template ast-no-sidebar" suppressHydrationWarning>{children}</body></html>;
}
