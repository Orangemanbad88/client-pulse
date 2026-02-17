import './globals.css';
import { ClientShell } from '@/components/layout/ClientShell';

export const metadata = {
  title: 'ClientPulse',
  description: 'AI-Powered Client Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
