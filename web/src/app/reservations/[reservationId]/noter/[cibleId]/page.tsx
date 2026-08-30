import { NotationForm } from '@/modules/notation/components/NotationForm';

// Page de notation d'une session (US-16) — reste fine, comme les autres pages.
export default function NoterPage({ params }: { params: { reservationId: string; cibleId: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <NotationForm reservationId={params.reservationId} cibleId={params.cibleId} />
    </main>
  );
}
