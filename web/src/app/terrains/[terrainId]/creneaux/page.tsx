import { CreneauxManager } from '@/modules/annonces/components/CreneauxManager';

// Page de gestion des créneaux d'un terrain (US-05 / RF-006) — reste fine : toute la logique
// vit dans le module annonces. `terrainId` vient du segment dynamique de la route.
export default function CreneauxPage({ params }: { params: { terrainId: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <CreneauxManager terrainId={params.terrainId} />
    </main>
  );
}
