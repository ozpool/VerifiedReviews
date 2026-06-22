import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AdminClient } from '@/components/admin/AdminClient';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-ink mb-8">Admin</h1>
        <AdminClient />
      </main>
      <SiteFooter />
    </>
  );
}
