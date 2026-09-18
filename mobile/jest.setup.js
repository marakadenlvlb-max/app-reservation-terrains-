// Les tests rendent chaque écran isolément (pas le layout racine, voir app/_layout.tsx), donc sans
// <SafeAreaProvider> ancêtre — `useSafeAreaInsets` planterait sinon ("No safe area value
// available"). Insets fixes à zéro : suffisant, les tests ne vérifient jamais de valeur de padding
// précise, seulement que les écrans utilisant le hook (voir US-05, régression edge-to-edge SDK 57)
// continuent de rendre et de fonctionner.
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(insets),
    SafeAreaView: require('react-native').View,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});
