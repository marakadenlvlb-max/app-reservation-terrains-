import { useLocalSearchParams } from 'expo-router';
import { CreneauxScreen } from '../../../src/modules/annonces/screens/CreneauxScreen';

// Atteint depuis /mes-annonces (US-29).
export default function CreneauxRoute() {
  const { terrainId } = useLocalSearchParams<{ terrainId: string }>();
  return <CreneauxScreen terrainId={terrainId} />;
}
