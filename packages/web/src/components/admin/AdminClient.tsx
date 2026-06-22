'use client';

import { useSession } from '@/lib/session';
import { loginAdmin, type AdminSession } from '@/lib/api';
import { LoginForm } from '@/components/auth/LoginForm';
import { ApprovalQueue } from './ApprovalQueue';
import { Loading } from '@/components/ui/StatusStates';

/** Admin area: sign in, then moderate the pending-business queue. */
export function AdminClient() {
  const { value: session, set, clear, ready } = useSession<AdminSession>('vr_admin');

  if (!ready) return <Loading label="Loading…" />;
  if (!session) {
    return (
      <LoginForm
        title="Admin sign in"
        onLogin={async (email, password) => {
          set(await loginAdmin(email, password));
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Pending approvals</h2>
        <button onClick={clear} className="text-sm text-muted hover:text-ink transition-colors">
          Log out
        </button>
      </div>
      <ApprovalQueue token={session.token} />
    </div>
  );
}
