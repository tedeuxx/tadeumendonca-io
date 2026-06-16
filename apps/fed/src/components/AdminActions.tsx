// Admin edit/delete controls for a single entity (/frontend/forms) — rendered in the detail-page header
// for posts and articles. Admin-only (same cosmetic gate as NewPostButton; the BFF re-checks the group).
// Delete is a two-step inline confirm (no native dialog), so it's keyboard- and test-friendly.
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/authStore';

export function AdminActions({ editTo, onDelete, isDeleting }: { editTo: string; onDelete: () => void; isDeleting?: boolean }) {
  const { isAdmin } = useAuth();
  const [confirming, setConfirming] = useState(false);
  if (!isAdmin) return null;

  const pill = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors';

  return (
    <div className="flex items-center gap-1.5">
      <RouterLink to={editTo} className={`${pill} border border-border text-foreground hover:bg-muted`}>
        <Pencil size={15} /> Editar
      </RouterLink>
      {confirming ? (
        <>
          <button onClick={onDelete} disabled={isDeleting} className={`${pill} bg-red-600 text-white hover:bg-red-700 disabled:opacity-60`}>
            <Trash2 size={15} /> Confirmar
          </button>
          <button onClick={() => setConfirming(false)} className={`${pill} text-muted-foreground hover:text-foreground`}>
            Cancelar
          </button>
        </>
      ) : (
        <button onClick={() => setConfirming(true)} className={`${pill} border border-border text-red-500 hover:bg-red-500/10`}>
          <Trash2 size={15} /> Excluir
        </button>
      )}
    </div>
  );
}
