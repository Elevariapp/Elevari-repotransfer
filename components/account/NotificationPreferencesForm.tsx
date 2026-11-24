'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAccountUser } from '@/components/account/AccountFrame';
import { ListError, ListNote, ListSkeleton } from '@/components/account/ListStates';
import { wanaApi, type NotificationPreferences, type NotificationPreferencesPatch } from '@/lib/api-client';
import { cx } from '@/lib/cx';

type Channel = keyof NotificationPreferences;

interface PreferenceRow {
  id: string;
  channel: Channel;
  key: string;
  label: string;
  hint: string;
  hostOnly?: boolean;
}

const EMAIL_ROWS: PreferenceRow[] = [
  {
    id: 'email-reminders',
    channel: 'email',
    key: 'reminders',
    label: 'Recordatorio de check-in',
    hint: 'Un correo el día antes de tu llegada.',
  },
  {
    id: 'email-host-bookings',
    channel: 'email',
    key: 'host_bookings',
    label: 'Reservas de tus espacios',
    hint: 'Un correo cuando un huésped reserva o cancela.',
    hostOnly: true,
  },
];

const PUSH_ROWS: PreferenceRow[] = [
  {
    id: 'push-bookings',
    channel: 'push',
    key: 'bookings',
    label: 'Tus reservas',
    hint: 'Confirmaciones, cancelaciones y reservas sin pagar que vencen.',
  },
  {
    id: 'push-reminders',
    channel: 'push',
    key: 'reminders',
    label: 'Recordatorio de check-in',
    hint: 'Un aviso el día antes de tu llegada.',
  },
  {
    id: 'push-host-bookings',
    channel: 'push',
    key: 'host_bookings',
    label: 'Reservas de tus espacios',
    hint: 'Un aviso cuando un huésped reserva o cancela.',
    hostOnly: true,
  },
];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; prefs: NotificationPreferences };

function valueOf(prefs: NotificationPreferences, row: PreferenceRow): boolean {
  return (prefs[row.channel] as Record<string, boolean>)[row.key] ?? true;
}

function withValue(prefs: NotificationPreferences, row: PreferenceRow, value: boolean): NotificationPreferences {
  return { ...prefs, [row.channel]: { ...prefs[row.channel], [row.key]: value } };
}

function Switch({
  row,
  on,
  busy,
  onToggle,
}: {
  row: PreferenceRow;
  on: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      {/* aria-busy instead of disabled: a disabled button drops keyboard focus in the middle of a toggle. */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-busy={busy || undefined}
        aria-labelledby={`${row.id}-label`}
        aria-describedby={`${row.id}-hint`}
        onClick={onToggle}
        className={cx(
          'flex min-h-[64px] w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-elevari-ivory/60 focus-visible:bg-elevari-ivory/60',
          // The card clips overflow, so the focus ring has to be drawn inside the row to stay visible.
          'focus-visible:[outline-offset:-3px]',
          busy && 'opacity-70',
        )}
      >
        <span className="min-w-0 flex-1">
          <span id={`${row.id}-label`} className="block text-sm font-semibold text-elevari-slate">
            {row.label}
          </span>
          <span id={`${row.id}-hint`} className="block text-xs leading-relaxed text-elevari-muted">
            {row.hint}
          </span>
        </span>
        <span
          aria-hidden
          className={cx(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors motion-reduce:transition-none',
            on ? 'bg-elevari-forest' : 'bg-elevari-muted',
          )}
        >
          <span
            className={cx(
              'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-elevari-surface shadow transition-transform motion-reduce:transition-none',
              on && 'translate-x-5',
            )}
          />
        </span>
      </button>
    </li>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="elevari-eyebrow px-1">
        {title}
      </h2>
      {description && <p className="mt-1 px-1 text-xs leading-relaxed text-elevari-muted">{description}</p>}
      <ul className="elevari-card mt-3 divide-y divide-elevari-border overflow-hidden">{children}</ul>
    </section>
  );
}

export default function NotificationPreferencesForm() {
  const user = useAccountUser();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(() => {
    wanaApi
      .getNotificationPreferences()
      .then((res) => setState({ status: 'ready', prefs: res.preferences }))
      .catch((err: unknown) =>
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'No pudimos cargar tus preferencias.',
        }),
      );
  }, []);

  useEffect(() => {
    load();
    return () => clearTimeout(savedTimer.current);
  }, [load]);

  const setSavingFlag = (id: string, active: boolean) =>
    setSaving((current) => {
      const next = new Set(current);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });

  const setValue = (row: PreferenceRow, value: boolean) =>
    setState((current) =>
      current.status === 'ready' ? { status: 'ready', prefs: withValue(current.prefs, row, value) } : current,
    );

  const toggle = async (row: PreferenceRow) => {
    if (state.status !== 'ready' || saving.has(row.id)) return;
    const previous = valueOf(state.prefs, row);
    const next = !previous;

    setValue(row, next);
    setSavingFlag(row.id, true);
    setSaved(false);
    try {
      const patch = { [row.channel]: { [row.key]: next } } as NotificationPreferencesPatch;
      const { preferences } = await wanaApi.updateNotificationPreferences(patch);
      setValue(row, valueOf(preferences, row));
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setValue(row, previous);
      toast.error(err instanceof Error ? err.message : 'No pudimos guardar el cambio. Inténtalo de nuevo.');
    } finally {
      setSavingFlag(row.id, false);
    }
  };

  if (state.status === 'loading') return <ListSkeleton />;
  if (state.status === 'error') {
    return (
      <ListError
        message={state.message}
        onRetry={() => {
          setState({ status: 'loading' });
          load();
        }}
      />
    );
  }

  const { prefs } = state;
  const showHost = user.role !== 'guest';
  const visible = (rows: PreferenceRow[]) => rows.filter((row) => showHost || !row.hostOnly);
  const renderRows = (rows: PreferenceRow[]) =>
    visible(rows).map((row) => (
      <Switch
        key={row.id}
        row={row}
        on={valueOf(prefs, row)}
        busy={saving.has(row.id)}
        onToggle={() => void toggle(row)}
      />
    ));

  return (
    <div className="space-y-8">
      <Section id="prefs-email" title="Por correo">
        {renderRows(EMAIL_ROWS)}
      </Section>
      <Section
        id="prefs-push"
        title="En la app del celular"
        description="Llegan a la app de Elevari en Android y iOS cuando permites las notificaciones en tu dispositivo."
      >
        {renderRows(PUSH_ROWS)}
      </Section>
      <ListNote>
        Los correos de tus reservas (confirmación, cancelación y recibo) y los de seguridad de tu cuenta se envían
        siempre, para que no te pierdas nada importante.
      </ListNote>
      <p role="status" aria-live="polite" className="min-h-[1.25rem] px-1 text-sm font-semibold text-elevari-forest-deep">
        {saved ? 'Cambios guardados' : ''}
      </p>
    </div>
  );
}
