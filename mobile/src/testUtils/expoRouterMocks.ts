/**
 * Singletons partagés entre `__mocks__/expo-router.tsx` (mock manuel appliqué automatiquement
 * par Jest à l'exécution) et les fichiers de test qui veulent asserter dessus.
 *
 * Vivent dans un module à part (plutôt que d'être exportés directement par le mock, en plus de
 * `useRouter`/`Link`) car TypeScript type-checke les imports contre le vrai `expo-router` (ses
 * `.d.ts` réels, pas le mock Jest, qui n'existe qu'à l'exécution) — `import { pushMock } from
 * 'expo-router'` échouerait donc `tsc --noEmit` même si Jest le résout correctement.
 */
export const pushMock = jest.fn();
export const replaceMock = jest.fn();
