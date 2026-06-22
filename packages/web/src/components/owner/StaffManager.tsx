'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStaff, addStaff, removeStaff, type OwnerSession } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';

const input =
  'bg-paper border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

/** Owner staff management: list, add, and deactivate staff. */
export function StaffManager({ session }: { session: OwnerSession }) {
  const { token, businessId } = session;
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const staff = useQuery({
    queryKey: ['staff', businessId],
    queryFn: () => fetchStaff(token, businessId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff', businessId] });

  const add = useMutation({
    mutationFn: () => addStaff(token, businessId, email, password),
    onSuccess: () => {
      setEmail('');
      setPassword('');
      setFormError('');
      invalidate();
    },
    onError: () => setFormError('Could not add staff — check the email isn’t already in use.'),
  });

  const remove = useMutation({
    mutationFn: (staffId: string) => removeStaff(token, businessId, staffId),
    onSuccess: invalidate,
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-ink">Staff</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@email"
          aria-label="Staff email"
          className={input}
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temp password (8+)"
          aria-label="Staff password"
          className={input}
        />
        <Button type="submit" size="sm" loading={add.isPending} disabled={add.isPending}>
          Add staff
        </Button>
      </form>
      {formError && (
        <p role="alert" className="text-sm text-accent">
          {formError}
        </p>
      )}

      {staff.isPending ? (
        <Loading label="Loading staff…" />
      ) : staff.isError ? (
        <ErrorState message="Couldn't load staff." retry={() => staff.refetch()} />
      ) : staff.data.length === 0 ? (
        <Empty
          title="No staff yet"
          description="Add a staff member so they can mint VisitProofs."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {staff.data.map((m) => (
            <li key={m._id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">{m.email}</span>
              <button
                onClick={() => remove.mutate(m._id)}
                disabled={remove.isPending}
                className="text-muted hover:text-accent transition-colors text-xs disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
