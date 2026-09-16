import { RootRedirect } from '@/modules/navigation/components/RootRedirect';

// Page racine (US-28) — reste fine : toute la logique de redirection vit dans le module
// navigation.
export default function RootPage() {
  return <RootRedirect />;
}
