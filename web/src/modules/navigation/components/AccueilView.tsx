import Link from 'next/link';

/**
 * Accueil post-connexion — US-27 (module Navigation & Interface globale). Un seul écran combiné
 * plutôt qu'un aiguillage par rôle : `UTILISATEUR` n'a pas de champ `role` dans le modèle de
 * données (architecture.md, révision du 16 septembre 2026) — un même compte peut être à la fois
 * joueur et propriétaire/gestionnaire, donc l'accueil donne accès aux deux univers sans distinction.
 */
export function AccueilView() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Bienvenue</h1>
      <div className="flex flex-col gap-3">
        <Link
          href="/recherche"
          className="rounded border border-gray-300 px-4 py-3 font-medium hover:bg-gray-50"
        >
          Trouver un terrain à réserver
        </Link>
        <Link
          href="/mes-annonces"
          className="rounded border border-gray-300 px-4 py-3 font-medium hover:bg-gray-50"
        >
          Gérer mes annonces de terrain
        </Link>
      </div>
    </div>
  );
}
