import './src/global.css';
import { RegisterScreen } from './src/modules/authentification/screens/RegisterScreen';

// Point d'entrée minimal : l'app branchera un vrai routeur (ex. Expo Router) une fois plus
// d'écrans existeront. Pour US-01 seule, on affiche directement l'écran d'inscription.
export default function App() {
  return <RegisterScreen />;
}
