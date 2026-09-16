'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSessionToken } from '@app/auth-core';
import { webSessionStorage } from '../../authentification/sessionStorage';
import { LogoutButton } from '../../authentification/components/LogoutButton';

/**
 * 8 entrées verrouillées avec le porteur de projet à la livraison d'US-27 (backlog.md, Sprint 19)
 * — Parrainage n'y figure pas en tant que lien de menu à part entière : regroupé sous Profil
 * (lien ajouté sur la page /profil elle-même) plutôt que d'occuper une entrée. Recommandations
 * ajoutée par US-28 (Sprint 20, sur demande explicite : "dans la nav globale, accessible
 * partout") — 9 entrées désormais, seule exception au principe "regroupé plutôt qu'ajouté".
 */
const LIENS: { href: string; label: string }[] = [
  { href: '/accueil', label: 'Accueil' },
  { href: '/recherche', label: 'Recherche' },
  { href: '/recommandations', label: 'Recommandations' },
  { href: '/mes-annonces', label: 'Mes annonces' },
  { href: '/historique/joueur', label: 'Mes réservations' },
  { href: '/messagerie', label: 'Messagerie' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/profil', label: 'Profil' },
];

/** Masquée explicitement sur ces routes (US-27) même si un marqueur de session traînait encore. */
const ROUTES_SANS_NAV = ['/connexion', '/inscription'];

/**
 * Barre de navigation horizontale persistante — US-27 (module Navigation & Interface globale).
 * Rendue dans le layout racine, mais c'est elle qui décide de s'afficher ou non plutôt que le
 * layout (server component) : la détection de session est un besoin client (marqueur en
 * localStorage, voir sessionStorage.ts).
 */
export function NavBar() {
  const pathname = usePathname();
  const token = useSessionToken(webSessionStorage);

  if (ROUTES_SANS_NAV.includes(pathname)) return null;
  // `undefined` (pas encore résolu) et `null` (non connecté) doivent tous deux masquer la nav —
  // voir useSessionToken pour pourquoi ces deux états sont distingués ailleurs dans le projet.
  if (!token) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="flex items-center gap-4 border-b border-gray-200 px-4 py-3"
    >
      {LIENS.map((lien) => {
        const actif = pathname === lien.href;
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={actif ? 'page' : undefined}
            className={`text-sm font-medium ${actif ? 'text-blue-600 underline' : 'text-gray-700'}`}
          >
            {lien.label}
          </Link>
        );
      })}
      <div className="ml-auto">
        <LogoutButton />
      </div>
    </nav>
  );
}
