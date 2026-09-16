import { useLocalSearchParams } from 'expo-router';
import { EditTerrainScreen } from '../../../src/modules/annonces/screens/EditTerrainScreen';

// Atteint depuis /mes-annonces (US-29).
export default function ModifierTerrainRoute() {
  const { terrainId } = useLocalSearchParams<{ terrainId: string }>();
  return <EditTerrainScreen terrainId={terrainId} />;
}
