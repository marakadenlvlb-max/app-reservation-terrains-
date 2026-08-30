import { EditTerrainForm } from '@/modules/annonces/components/EditTerrainForm';

// Page de modification/retrait d'une annonce (US-06) — reste fine, comme les autres pages.
export default function ModifierTerrainPage({ params }: { params: { terrainId: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <EditTerrainForm terrainId={params.terrainId} />
    </main>
  );
}
