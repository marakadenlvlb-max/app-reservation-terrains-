import { HistoriqueList } from '@/modules/historique/components/HistoriqueList';

// Historique côté joueur (US-18) — reste fine, comme les autres pages.
export default function HistoriqueJoueurPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <HistoriqueList role="joueur" />
    </main>
  );
}
