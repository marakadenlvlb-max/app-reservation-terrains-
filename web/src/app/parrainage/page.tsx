import { ParrainageView } from '@/modules/parrainage/components/ParrainageView';

// Page de parrainage (US-26) — reste fine, comme les autres pages.
export default function ParrainagePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <ParrainageView />
    </main>
  );
}
