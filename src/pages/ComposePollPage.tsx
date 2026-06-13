// Admin poll ("enquete") compose (/frontend/forms). Creates a poll, or edits one when the route carries
// a :pollId. Behind RequireAuth admin in the router; the BFF re-checks the admin group. Options are a
// dynamic list (2..10): an existing option keeps its id so its votes survive the edit; a new row has no
// id and the server mints one. A successful save returns to the feed, where the aside widget shows it.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useAdminPoll, useCreatePoll, useUpdatePoll, type PollInputOption } from '../hooks/usePoll';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';
import { Field, TextInput, ToggleSwitch, PrimaryButton, GhostButton } from '../components/Form';

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;
const emptyOptions = (): PollInputOption[] => [{ label: '' }, { label: '' }];

export function ComposePollPage() {
  const navigate = useNavigate();
  const { pollId } = useParams<{ pollId: string }>();
  const isEdit = Boolean(pollId);

  const existing = useAdminPoll(pollId ?? '', isEdit);
  const create = useCreatePoll();
  const update = useUpdatePoll(pollId ?? '');
  const save = isEdit ? update : create;

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollInputOption[]>(emptyOptions);
  const [published, setPublished] = useState(false);
  const [touched, setTouched] = useState(false);

  const prefilled = useRef(false);
  useEffect(() => {
    if (existing.data && !prefilled.current) {
      prefilled.current = true;
      setQuestion(existing.data.question);
      setOptions(existing.data.options.map((o) => ({ id: o.id, label: o.label })));
      setPublished(existing.data.published);
    }
  }, [existing.data]);

  const filled = options.filter((o) => o.label.trim());
  const questionError = touched && !question.trim() ? 'A pergunta é obrigatória' : undefined;
  const optionsError = touched && filled.length < MIN_OPTIONS ? 'Informe ao menos duas opções' : undefined;

  const setOptionLabel = (i: number, label: string) => setOptions((os) => os.map((o, k) => (k === i ? { ...o, label } : o)));
  const addOption = () => setOptions((os) => (os.length < MAX_OPTIONS ? [...os, { label: '' }] : os));
  const removeOption = (i: number) => setOptions((os) => (os.length > MIN_OPTIONS ? os.filter((_, k) => k !== i) : os));

  const submit = () => {
    setTouched(true);
    if (!question.trim() || filled.length < MIN_OPTIONS) return;
    const payload = { question: question.trim(), options: filled.map((o) => ({ id: o.id, label: o.label.trim() })), published };
    save.mutate(payload, { onSuccess: () => navigate('/') });
  };

  if (isEdit && existing.isLoading) return <CenterLoader />;
  if (isEdit && existing.isError) {
    return (
      <div>
        <ColumnHeader title="Editar enquete" back />
        <Notice>Não foi possível carregar esta enquete. Talvez não exista ou não esteja publicada.</Notice>
      </div>
    );
  }

  return (
    <div>
      <ColumnHeader title={isEdit ? 'Editar enquete' : 'Nova enquete'} back />
      <div className="space-y-5 px-4 py-5">
        {save.isError && <Notice>Não foi possível salvar a enquete. Verifique suas permissões e tente novamente.</Notice>}

        <Field label="Pergunta" error={questionError}>
          <TextInput value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Qual a pergunta da enquete?" />
        </Field>

        <Field label="Opções" description="De 2 a 10 opções" error={optionsError}>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput value={o.label} onChange={(e) => setOptionLabel(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label={`Remover opção ${i + 1}`}
                  className="shrink-0 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <GhostButton onClick={addOption} className="gap-1.5">
                <Plus size={16} /> Adicionar opção
              </GhostButton>
            )}
          </div>
        </Field>

        <ToggleSwitch checked={published} onChange={setPublished}>
          Publicar agora
        </ToggleSwitch>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={() => navigate('/')}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={save.isPending}>
            {isEdit ? 'Salvar alterações' : published ? 'Publicar' : 'Salvar rascunho'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
