import { CreateTerrainForm } from '@/modules/annonces/components/CreateTerrainForm';

// Page de publication d'annonce (US-04 / RF-004/RF-005) — reste fine, comme les autres pages :
// toute la logique vit dans le module annonces.
export default function NouveauTerrainPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <CreateTerrainForm />
    </main>
  );
}
