import './globals.css';
import PwaInstallPrompt from '../components/PwaInstallPrompt';
import MascotGuide from '../components/MascotGuide';
import Footer from '../components/Footer';
import BrandSplash from '../components/BrandSplash';
import { AuthProvider } from '../components/AuthProvider';
import { LanguageProvider } from '../components/LanguageProvider';

export const metadata = {
  title: 'Verilo — Trusted local professionals',
  description: 'Find trusted plumbers, electricians, tutors and more in your area.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Verilo',
  },
};

export const viewport = { themeColor: '#FFFFFF' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rozha+One&family=Mukta:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BrandSplash />
        <AuthProvider>
          <LanguageProvider>
            {children}
            <Footer />
          </LanguageProvider>
        </AuthProvider>
        <PwaInstallPrompt />
        <MascotGuide name="Verilo Saathi" accent="#F28A1E" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
