import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'ProcureX — P2P Procurement ERP',
  description: 'Procure-to-Pay ERP with Vendor Catalog, Orders & Inventory',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <UserPreferencesProvider>
            <AppShell>{children}</AppShell>
          </UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
