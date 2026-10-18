export const metadata = {
  title: 'Verilo Provider',
  manifest: '/manifest-provider.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Verilo Provider' },
};

export const viewport = { themeColor: '#1F6F52' };

export default function ProviderLayout({ children }) {
  return children;
}
