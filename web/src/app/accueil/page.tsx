import { AccueilView } from '@/modules/navigation/components/AccueilView';

// Accueil post-connexion (US-27) — reste fine, comme les autres pages : toute la logique vit
// dans le module navigation.
export default function AccueilPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <AccueilView />
    </main>
  );
}
