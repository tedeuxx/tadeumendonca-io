// Install ("add to home screen") banner (/frontend/design-system) — a dismissible bar in the app
// chrome. On Android/desktop it's a one-tap install button; on iOS it shows the manual Share → "Add to
// Home Screen" steps (iOS has no install API). Renders nothing once installed or dismissed.
import { Download, Share, Plus, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallPrompt() {
  const { mode, promptInstall, dismiss } = useInstallPrompt();
  if (!mode) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-primary/10 px-4 py-2 text-sm text-foreground">
      <Download size={16} className="shrink-0 text-primary" />
      {mode === 'button' ? (
        <>
          <span className="min-w-0 flex-1 truncate">Instale o tadeumendonca.io como app.</span>
          <button
            onClick={() => void promptInstall()}
            className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Instalar
          </button>
        </>
      ) : (
        <span className="min-w-0 flex-1">
          Instale o app: toque em <Share size={14} className="mx-0.5 -mt-0.5 inline" aria-label="Compartilhar" /> e depois{' '}
          <span className="whitespace-nowrap font-semibold">
            Adicionar à Tela de Início <Plus size={13} className="-mt-0.5 inline" />
          </span>
          .
        </span>
      )}
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
