import { useLocalSearchParams } from 'expo-router';
import { MessagerieScreen } from '../../../src/modules/messagerie/screens/MessagerieScreen';

// Atteint depuis /messagerie et /historique/joueur|proprietaire (US-29).
export default function MessagesRoute() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  return <MessagerieScreen reservationId={reservationId} />;
}
