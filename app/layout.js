import './globals.css';
import PwaInstallPrompt from '../components/PwaInstallPrompt';
import Footer from '../components/Footer';
import { AuthProvider } from '../components/AuthProvider';

export const metadata = {
  title: 'Verilo — Trusted local professionals',
  description: 'Find trusted plumbers, electricians, tutors and more in your area.',
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Verilo',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rozha+One&family=Mukta:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Footer />
        </AuthProvider>
        <PwaInstallPrompt />
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
