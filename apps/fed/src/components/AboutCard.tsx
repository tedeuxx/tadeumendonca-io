// About block for the landing's slim aside. Reader-first and deliberately impersonal: it explains
// what the SITE is for and defers the person to /cv. No name, no bio — the landing is the brand,
// /cv is the person. The one personal token here is the avatar next to the "quem escreve" link:
// a face, not a byline. It is the site's one round element (`.avatar-round`) — a portrait reads as a
// portrait, while every actual surface stays radius 0. See ADR-0008's amendment.
import { Link as RouterLink } from 'react-router-dom';
import avatar from '../assets/avatar.jpg';
import { useT } from '../i18n';

export function AboutCard() {
  const t = useT();
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1.5 shrink-0 bg-primary" />
        <h3 className="label-mono text-foreground">{t('about.heading')}</h3>
      </div>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{t('about.body')}</p>
      <RouterLink to="/cv" className="group mt-4 flex items-center gap-3">
        <img
          src={avatar}
          alt=""
          aria-hidden="true"
          width={56}
          height={56}
          loading="lazy"
          className="avatar-round h-14 w-14 shrink-0 border border-border object-cover grayscale transition-[filter,border-color] duration-150 group-hover:border-primary group-hover:grayscale-0"
        />
        <span className="border-b border-primary pb-0.5 font-mono text-sm uppercase tracking-wider">
          {t('about.whoWrites')} <span className="text-primary">↗</span>
        </span>
      </RouterLink>
    </div>
  );
}
