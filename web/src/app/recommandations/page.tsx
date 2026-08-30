import { RecommandationsList } from '@/modules/recherche/components/RecommandationsList';

// Page de recommandations (US-25) — reste fine, comme les autres pages.
export default function RecommandationsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <RecommandationsList />
    </main>
  );
}
