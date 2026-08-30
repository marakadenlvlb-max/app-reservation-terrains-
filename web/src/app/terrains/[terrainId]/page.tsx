import { TerrainDetailView } from '@/modules/recherche/components/TerrainDetailView';

// Page de consultation d'une annonce (US-08) — publique, accessible sans connexion.
export default function TerrainDetailPage({ params }: { params: { terrainId: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <TerrainDetailView terrainId={params.terrainId} />
    </main>
  );
}
