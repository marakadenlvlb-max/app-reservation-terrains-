import { MessagerieView } from '@/modules/messagerie/components/MessagerieView';

// Page de conversation liée à une réservation (US-24) — reste fine, comme les autres pages.
export default function MessagesPage({ params }: { params: { reservationId: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <MessagerieView reservationId={params.reservationId} />
    </main>
  );
}
