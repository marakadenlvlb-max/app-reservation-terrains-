import { ReversementsList } from '@/modules/paiement/components/ReversementsList';

// Page des reversements du propriétaire/gestionnaire (US-15) — reste fine, comme les autres.
export default function ReversementsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <ReversementsList />
    </main>
  );
}
