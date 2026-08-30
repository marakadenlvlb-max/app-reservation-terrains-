import { LoginForm } from '@/modules/authentification/components/LoginForm';

// Page de connexion (US-02 / RF-002) — reste fine, comme la page d'inscription : toute la
// logique vit dans le module authentification.
export default function ConnexionPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <LoginForm />
    </main>
  );
}
