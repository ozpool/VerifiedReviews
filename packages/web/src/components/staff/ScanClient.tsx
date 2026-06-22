'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/session';
import type { StaffSession } from '@/lib/api';
import { StaffLogin } from './StaffLogin';
import { MintPanel } from './MintPanel';
import { MintLog } from './MintLog';
import { Loading } from '@/components/ui/StatusStates';

/** Staff scanner shell: gate on a stored session, else show the login form. */
export function ScanClient() {
  const { value: session, set, clear, ready } = useSession<StaffSession>('vr_staff');
  const queryClient = useQueryClient();

  if (!ready) return <Loading label="Loading…" />;
  if (!session) {
    return (
      <div className="max-w-sm">
        <StaffLogin onLogin={set} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Signed in · business <span className="font-mono">#{session.businessId}</span>
        </p>
        <button onClick={clear} className="text-sm text-muted hover:text-ink transition-colors">
          Log out
        </button>
      </div>
      <MintPanel
        session={session}
        onMinted={() => queryClient.invalidateQueries({ queryKey: ['mints'] })}
      />
      <MintLog token={session.token} />
    </div>
  );
}
