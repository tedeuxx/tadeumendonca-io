// Account settings (/frontend/forms) — the signed-in user edits their apelido + newsletter prefs.
// Behind RequireAuth (any user) in the router; the BFF scopes everything to the caller's token sub.
// Avatar upload lands in a follow-up. pt-BR, BVB theme.
import { useEffect, useRef, useState } from 'react';
import { useMe, useUpdateMe, type DigestSchedule } from '../hooks/useMe';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';
import { Field, TextInput, ToggleSwitch, PrimaryButton } from '../components/Form';
import { cn } from '../lib/cn';

const selectClass =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40';

export function AccountPage() {
  const me = useMe();
  const update = useUpdateMe();

  const [nickname, setNickname] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [schedule, setSchedule] = useState<DigestSchedule>('weekly');
  const [saved, setSaved] = useState(false);

  const prefilled = useRef(false);
  useEffect(() => {
    if (me.data && !prefilled.current) {
      prefilled.current = true;
      setNickname(me.data.nickname ?? '');
      setOptIn(me.data.newsletter_opt_in);
      setSchedule(me.data.newsletter_schedule ?? 'weekly');
    }
  }, [me.data]);

  if (me.isLoading) return <CenterLoader />;
  if (me.isError) {
    return (
      <div>
        <ColumnHeader title="Minha conta" />
        <Notice>Não foi possível carregar sua conta. Tente novamente.</Notice>
      </div>
    );
  }

  const submit = () => {
    setSaved(false);
    update.mutate(
      { nickname: nickname.trim() || undefined, newsletter_opt_in: optIn, newsletter_schedule: schedule },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <div>
      <ColumnHeader title="Minha conta" />
      <div className="space-y-5 px-4 py-5">
        {update.isError && <Notice>Não foi possível salvar. Verifique a conexão e tente novamente.</Notice>}
        {saved && !update.isPending && <p className="text-sm font-medium text-primary">Preferências salvas.</p>}

        <Field label="Apelido" description="Como você aparece no site (opcional)">
          <TextInput value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={40} placeholder="Seu apelido" />
        </Field>

        <div className="space-y-3">
          <ToggleSwitch checked={optIn} onChange={setOptIn}>
            Receber a newsletter por e-mail
          </ToggleSwitch>
          {optIn && (
            <Field label="Frequência">
              <select aria-label="Frequência" value={schedule} onChange={(e) => setSchedule(e.target.value as DigestSchedule)} className={cn(selectClass)}>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
              </select>
            </Field>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <PrimaryButton onClick={submit} disabled={update.isPending}>
            Salvar
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
