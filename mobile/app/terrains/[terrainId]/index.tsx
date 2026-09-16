import { useLocalSearchParams } from 'expo-router';
import { TerrainDetailScreen } from '../../../src/modules/recherche/screens/TerrainDetailScreen';

// Page de consultation d'une annonce (US-08), publique — atteinte depuis la recherche et les
// recommandations (US-29). `terrainId` lu depuis la route plutôt que reçu en prop codée en dur.
export default function TerrainDetailRoute() {
  const { terrainId } = useLocalSearchParams<{ terrainId: string }>();
  return <TerrainDetailScreen terrainId={terrainId} />;
}
