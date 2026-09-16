import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/modules/navigation/components/NavBar';

export const metadata: Metadata = {
  title: 'Réservation de terrains de sport',
};

// US-27 (module Navigation & Interface globale) : NavBar décide elle-même de s'afficher ou non
// (session + route courante, besoins client) — ce layout racine reste un composant serveur.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
