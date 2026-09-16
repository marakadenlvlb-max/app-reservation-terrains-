import { MesAnnoncesList } from '@/modules/annonces/components/MesAnnoncesList';

// Liste des annonces du propriétaire/gestionnaire connecté (US-27) — destination du lien de
// menu "Mes annonces", module Navigation & Interface globale.
export default function MesAnnoncesPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <MesAnnoncesList />
    </main>
  );
}
