import Link from 'next/link';
import { ProfileForm } from '@/modules/authentification/components/ProfileForm';

// Page de profil (US-03 / RF-003) — reste fine, comme les pages inscription/connexion : toute
// la logique vit dans le module authentification.
//
// US-27 (module Navigation & Interface globale) : Parrainage n'a pas sa propre entrée dans la
// barre de navigation globale (8 entrées verrouillées avec le porteur de projet, backlog.md) —
// regroupé ici, sous Profil, plutôt que d'occuper une 9e entrée.
export default function ProfilPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <ProfileForm />
      <Link href="/parrainage" className="text-sm text-blue-600 underline">
        Parrainer d'autres joueurs
      </Link>
    </main>
  );
}
