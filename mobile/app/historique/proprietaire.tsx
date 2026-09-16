import { HistoriqueScreen } from '../../src/modules/historique/screens/HistoriqueScreen';

// Hors tiroir (US-29) : atteinte uniquement via le lien croisé depuis /historique/joueur, comme
// /historique/proprietaire côté web (pas de 2e entrée de menu pour la même famille d'écran).
export default function HistoriqueProprietaireRoute() {
  return <HistoriqueScreen role="proprietaire" />;
}
