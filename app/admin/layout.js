export const metadata = {
  title: 'Verilo Admin',
  manifest: '/manifest-admin.json',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Verilo Admin' },
};

export const viewport = { themeColor: '#9C2E20' };

export default function AdminLayout({ children }) {
  return children;
}
