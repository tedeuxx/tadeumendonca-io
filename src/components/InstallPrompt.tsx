// Install ("add to home screen") banner (/frontend/design-system) — a dismissible bar in the app chrome.
// On Chromium (Android/desktop) it's a one-tap install button; otherwise it shows manual steps tailored
// to the detected browser (iOS Safari, macOS Safari, Firefox), since each installs differently. Renders
// nothing once installed or dismissed.
import { type ReactNode } from 'react';
import { Download, Share, Menu, X } from 'lucide-react';
import { useInstallPrompt, type InstallPlatform } from '../hooks/useInstallPrompt';

const ShareIcon = () => <Share size={14} className="mx-0.5 -mt-0.5 inline" aria-hidden="true" />;
const MenuIcon = () => <Menu size={14} className="mx-0.5 -mt-0.5 inline" aria-hidden="true" />;

// Word-complete on purpose (don't rely on the inline icon rendering) + the icon as a visual aid.
const MANUAL: Record<InstallPlatform, ReactNode> = {
  ios: (
    <>
      Instale o app: toque em <span className="font-semibold">Compartilhar</span>
      <ShareIcon /> na barra do Safari e escolha <span className="font-semibold">Adicionar à Tela de Início</span>.
    </>
  ),
  'macos-safari': (
    <>
      Instale o app: na barra do Safari, clique em <span className="font-semibold">Compartilhar</span>
      <ShareIcon /> e escolha <span className="font-semibold">Adicionar ao Dock</span>.
    </>
  ),
  firefox: (
    <>
      Instale o app: abra o menu <span className="font-semibold">⋯</span>
      <MenuIcon /> do Firefox e escolha <span className="font-semibold">Instalar</span> (ou Adicionar à Tela Inicial).
    </>
  ),
};

export function InstallPrompt() {
  const { mode, platform, promptInstall, dismiss } = useInstallPrompt();
  if (!mode) return null;

  return (
    <div className="flex items-start gap-2 border-b border-border bg-primary/10 px-4 py-2 text-sm text-foreground">
      <Download size={16} className="mt-0.5 shrink-0 text-primary" />
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
        <span className="min-w-0 flex-1 leading-snug">{platform && MANUAL[platform]}</span>
      )}
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="-mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
