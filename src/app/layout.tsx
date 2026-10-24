import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ToastProvider } from '@/lib/toast';

export const metadata: Metadata = {
  title: {
    default: 'CLIPROOM — Create. Discover. Share.',
    template: '%s · CLIPROOM',
  },
  description: 'A modern social network for short creative content. Create. Discover. Share.',
  applicationName: 'CLIPROOM',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: 'CLIPROOM',
    description: 'Create. Discover. Share.',
    siteName: 'CLIPROOM',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CLIPROOM',
    description: 'Create. Discover. Share.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-neutral-200">
        <ToastProvider>
          <Navbar />
          <div className="mx-auto max-w-7xl px-4 pt-20 pb-24 md:pb-8 flex gap-6">
            <Sidebar />
            <main className="flex-1 min-w-0 animate-fade-in">{children}</main>
          </div>
          <MobileNav />
                  <footer className="border-t border-[#1a1a1a] mt-8 py-6">
                    <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                      <div>© {new Date().getFullYear()} CLIPROOM · Create. Discover. Share.</div>
                      <div className="flex gap-4">
                        <a href="/privacy" className="hover:text-white">Privacy</a>
                        <a href="/terms" className="hover:text-white">Terms</a>
                        <a href="/api/health" className="hover:text-white">Status</a>
                      </div>
                    </div>
                  </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
