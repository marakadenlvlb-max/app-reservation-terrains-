// Pas `nativewind/types` (qui ne fait que réexporter cette même référence) : `nativewind` est
// hoisté à la racine du monorepo (seul mobile/ en dépend, mais rien n'empêche npm de le hoister),
// donc sa propre référence vers `react-native-css-interop/types` résout depuis SA position à lui —
// et retombe sur une copie de `react-native` imbriquée sous nativewind/node_modules, distincte
// (même version, mais chemin différent) de celle que mobile/ utilise réellement. Deux modules
// TypeScript différents = pas de fusion de déclaration, et `className` disparaît des props RN.
// En référençant `react-native-css-interop/types` directement depuis ici (mobile/), on résout la
// copie de react-native-css-interop propre à mobile/ (épinglée dans package.json pour la même
// raison), qui elle référence bien le `react-native` que le code de l'app importe réellement.
/// <reference types="react-native-css-interop/types" />

// TypeScript 6 signale désormais (TS2882) tout import à effet de bord d'une extension sans
// déclaration de module associée — nativewind/types ne couvre que l'augmentation des props
// (className...), pas cette déclaration `*.css` nécessaire pour `import '../src/global.css'`.
declare module '*.css';
