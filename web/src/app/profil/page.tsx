import { ProfileForm } from '@/modules/authentification/components/ProfileForm';

// Page de profil (US-03 / RF-003) — reste fine, comme les pages inscription/connexion : toute
// la logique vit dans le module authentification.
export default function ProfilPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <ProfileForm />
    </main>
  );
}
