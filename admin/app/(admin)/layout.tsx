import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';
import { MobileNav } from '@/components/nav/MobileNav';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { getNavBadges } from '@/lib/nav-badges';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.BYPASS_AUTH !== 'true') {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    if (user.user_metadata?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center p-lg">
          <div className="text-center max-w-sm">
            <p className="font-heading text-[28px] text-text-primary mb-sm">Access denied</p>
            <p className="font-body text-base text-text-tertiary">
              This portal is for administrators only.
            </p>
          </div>
        </div>
      );
    }
  }

  const badges = await getNavBadges();

  return (
    <ToastProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex min-h-screen">
        <Sidebar badges={badges} />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav badges={badges} />
          <main id="main-content" tabIndex={-1} className="flex-1 p-lg lg:p-xl pb-20 lg:pb-xl overflow-x-hidden outline-none">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
