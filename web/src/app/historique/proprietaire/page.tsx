import { HistoriqueList } from '@/modules/historique/components/HistoriqueList';

// Historique côté propriétaire/gestionnaire (US-19) — reste fine, comme les autres pages.
export default function HistoriqueProprietairePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <HistoriqueList role="proprietaire" />
    </main>
  );
}
