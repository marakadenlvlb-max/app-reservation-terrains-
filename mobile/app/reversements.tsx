import { ReversementsScreen } from '../src/modules/paiement/screens/ReversementsScreen';

// Hors tiroir (US-29) : atteint depuis /accueil, comme /reversements côté web (pas de champ
// `role` pour réserver une entrée de menu aux propriétaires/gestionnaires).
export default function ReversementsRoute() {
  return <ReversementsScreen />;
}
