module.exports = function (api) {
  api.cache(true);
  return {
    // `nativewind/babel` doit être un preset, pas un plugin : il renvoie lui-même un objet
    // `{ plugins: [...] }`, ce que Babel refuse dans un tableau `plugins` (erreur ".plugins is
    // not a valid Plugin property"). C'est la config attendue par NativeWind v4, malgré son nom
    // qui suggère un plugin.
    presets: [
      [
        'babel-preset-expo',
        // NativeWind embarque une copie transitive de react-native-reanimated (via
        // react-native-css-interop) pour son intégration optionnelle aux animations — on ne
        // l'utilise nulle part dans ce projet. babel-preset-expo l'active automatiquement dès
        // qu'il détecte le module, ce qui casse la compilation car sa dépendance
        // react-native-worklets n'est pas réellement installée. `reanimated: false` désactive
        // cette détection automatique, inutile ici.
        { reanimated: false },
      ],
      'nativewind/babel',
    ],
  };
};
