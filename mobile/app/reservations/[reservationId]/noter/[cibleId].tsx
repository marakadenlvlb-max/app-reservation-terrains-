import { useLocalSearchParams } from 'expo-router';
import { NotationScreen } from '../../../../src/modules/notation/screens/NotationScreen';

// Atteint depuis /historique/joueur|proprietaire (US-29).
export default function NoterRoute() {
  const { reservationId, cibleId } = useLocalSearchParams<{ reservationId: string; cibleId: string }>();
  return <NotationScreen reservationId={reservationId} cibleId={cibleId} />;
}
