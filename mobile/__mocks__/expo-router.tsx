import React from 'react';
import { Pressable, Text } from 'react-native';
import { pushMock, replaceMock } from '../src/testUtils/expoRouterMocks';

/**
 * Mock manuel de `expo-router` pour les tests (Jest applique automatiquement tout mock placé
 * dans `<rootDir>/__mocks__/<module>` pour un module de `node_modules`, sans `jest.mock()`
 * explicite dans chaque fichier de test — même besoin que le mock de `next/navigation` côté web
 * (Vitest, lui, exige un `vi.mock()` par fichier) : `useRouter()`/`Link` réels exigent un vrai
 * `NavigationContainer` monté, absent des tests de composant isolé.
 *
 * `pushMock`/`replaceMock` vivent dans `src/testUtils/expoRouterMocks.ts`, pas ici : un fichier
 * de test qui a besoin d'assertions les importe de là (pas de `'expo-router'`, dont les vrais
 * types ne les exportent pas — voir ce module pour le détail), et les réinitialise dans son
 * `beforeEach`. Les fichiers qui n'ont pas besoin d'assertions les ignorent simplement.
 */

export function useRouter() {
  return { push: pushMock, replace: replaceMock };
}

export function useLocalSearchParams() {
  return {};
}

interface LinkProps {
  href: string;
  children?: React.ReactNode;
  asChild?: boolean;
  [key: string]: unknown;
}

/**
 * `asChild` clone l'unique enfant (un `Pressable`) en lui injectant `onPress` — même usage que
 * le vrai `Link` d'expo-router. Sans `asChild`, rend un `Pressable`/`Text` pressable directement,
 * pour les usages "lien texte" (ex. `<Link href="/connexion">Se connecter</Link>`).
 */
export function Link({ href, children, asChild, ...props }: LinkProps) {
  const onPress = () => pushMock(href);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onPress });
  }

  return (
    <Pressable accessibilityRole="link" onPress={onPress} {...props}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </Pressable>
  );
}
