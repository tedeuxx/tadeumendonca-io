// Account settings (/frontend/forms) — the signed-in user edits their avatar + apelido + newsletter
// prefs. Behind RequireAuth (any user) in the router; the BFF scopes everything to the caller's token
// sub. pt-BR, BVB theme.
import { useEffect, useRef, useState } from 'react';
import { useMe, useUpdateMe, useUploadAvatar, avatarUrl, type DigestSchedule } from '../hooks/useMe';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';
import { Field, TextInput, ToggleSwitch, PrimaryButton } from '../components/Form';
import { Avatar } from '../components/Avatar';
import { cn } from '../lib/cn';

const selectClass =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // mirror the BFF cap, so we reject before the round-trip

// Read a File as a bare base64 string (no data-URI prefix) — the shape POST /me/avatar expects.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(file);
  });
}

function AvatarField({ avatarKey, fallback }: { avatarKey?: string; fallback: string }) {
  const upload = useUploadAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // Revoke the object URL when it changes/unmounts (avoid leaking the preview blob).
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onPick = async (file: File) => {
    setError(undefined);
    if (!file.type.startsWith('image/')) return setError('Selecione um arquivo de imagem.');
    if (file.size > MAX_AVATAR_BYTES) return setError('Imagem muito grande (máx. 5 MB).');
    setPreview(URL.createObjectURL(file));
    try {
      const base64 = await fileToBase64(file);
      upload.mutate(base64, { onSuccess: () => setPreview(undefined) }); // stored avatar takes over
    } catch {
      setError('Não foi possível ler a imagem.');
    }
  };

  return (
    <Field label="Foto" description="Aparece no menu da conta. Quadrada fica melhor.">
      <div className="flex items-center gap-4">
        <Avatar src={preview ?? avatarUrl(avatarKey)} fallback={fallback} className="h-16 w-16 text-xl" />
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-60"
          >
            {upload.isPending ? 'Enviando…' : avatarKey ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {upload.isError && !error && <p className="text-sm text-red-500">Falha no envio. Tente novamente.</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Escolher foto"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPick(f); e.target.value = ''; }}
        />
      </div>
    </Field>
  );
}

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

        <AvatarField avatarKey={me.data?.avatar_key} fallback={(me.data?.nickname ?? '?')[0]?.toUpperCase() ?? '?'} />

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
