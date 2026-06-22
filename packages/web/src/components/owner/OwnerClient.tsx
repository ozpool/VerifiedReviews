'use client';

import { useState } from 'react';
import { useSession } from '@/lib/session';
import { loginOwner, type OwnerSession } from '@/lib/api';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from './RegisterForm';
import { Dashboard } from './Dashboard';
import { StaffManager } from './StaffManager';
import { BadgeEmbed } from './BadgeEmbed';
import { Loading } from '@/components/ui/StatusStates';

/** Business owner area: dashboard, staff management, and badge embed. */
export function OwnerClient() {
  const { value: session, set, clear, ready } = useSession<OwnerSession>('vr_owner');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (!ready) return <Loading label="Loading…" />;
  if (!session) {
    if (mode === 'register') {
      return (
        <RegisterForm
          onRegistered={() => setMode('login')}
          onSwitchToLogin={() => setMode('login')}
        />
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <LoginForm
          title="Business owner sign in"
          onLogin={async (email, password) => {
            set(await loginOwner(email, password));
          }}
        />
        <button
          onClick={() => setMode('register')}
          className="text-sm text-muted hover:text-ink transition-colors text-left max-w-sm"
        >
          New business? Register here →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Signed in · business <span className="font-mono">#{session.businessId}</span>
        </p>
        <button onClick={clear} className="text-sm text-muted hover:text-ink transition-colors">
          Log out
        </button>
      </div>
      <Dashboard businessId={session.businessId} />
      <StaffManager session={session} />
      <BadgeEmbed businessId={session.businessId} />
    </div>
  );
}
