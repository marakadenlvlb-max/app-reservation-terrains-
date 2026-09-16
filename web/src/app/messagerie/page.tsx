import { MesConversationsList } from '@/modules/messagerie/components/MesConversationsList';

// Liste des conversations de l'utilisateur connecté (US-27) — destination du lien de menu
// "Messagerie", module Navigation & Interface globale.
export default function MessageriePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <MesConversationsList />
    </main>
  );
}
