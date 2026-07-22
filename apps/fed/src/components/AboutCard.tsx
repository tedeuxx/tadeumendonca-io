// About block for the landing's slim aside. Reader-first and deliberately impersonal: it explains
// what the SITE is for and defers the person to /cv. No name, no bio, no photo — that is the whole
// point of the split (the landing is the brand, /cv is the person).
import { Link as RouterLink } from 'react-router-dom';

export function AboutCard() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1.5 shrink-0 bg-primary" />
        <h3 className="label-mono text-foreground">Sobre este site</h3>
      </div>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Escrevo e construo em público sobre engenharia de IA. Se algo aqui te ajudou a evoluir, cumpriu o papel.
      </p>
      <RouterLink
        to="/cv"
        className="mt-3 inline-flex items-center gap-1.5 border-b border-primary pb-0.5 font-mono text-sm uppercase tracking-wider"
      >
        Quem escreve (CV) <span className="text-primary">↗</span>
      </RouterLink>
    </div>
  );
}
