import { RegisterForm } from '@/modules/authentification/components/RegisterForm';

// Page d'inscription (US-01 / RF-001) — reste volontairement fine : toute la logique de
// formulaire vit dans le module authentification, en cohérence avec le découpage par module de
// architecture.md plutôt que dans la route elle-même.
export default function InscriptionPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <RegisterForm />
    </main>
  );
}
