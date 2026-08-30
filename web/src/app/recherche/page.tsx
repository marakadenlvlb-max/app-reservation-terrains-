import { SearchTerrains } from '@/modules/recherche/components/SearchTerrains';

// Page de recherche de terrains (US-07) — publique, accessible sans connexion.
export default function RecherchePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <SearchTerrains />
    </main>
  );
}
