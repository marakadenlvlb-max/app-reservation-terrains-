import { RootRedirect } from '../src/modules/navigation/screens/RootRedirect';

// Point d'entrée (US-29) — reste fin : toute la logique de redirection vit dans le module
// navigation.
export default function RootRoute() {
  return <RootRedirect />;
}
