module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // `packages/*-core` sont résolus en tant que fichiers source bruts (voir alias ci-dessous), pas
    // en tant que module npm : leurs propres `import 'react'` internes se résolvent donc depuis
    // LEUR position sur le disque (packages/*-core), pas depuis mobile/ — et remontent jusqu'au
    // react hoisté à la racine du monorepo (18.x, pour web), différent de celui de mobile (19.x,
    // requis par expo/react-native ici). Deux instances de React dans un même arbre de rendu font
    // planter les hooks (`useState`/`useEffect` de la mauvaise instance). On force donc React à
    // toujours résoudre vers la copie propre à mobile, quel que soit le fichier qui l'importe.
    '^react$': '<rootDir>/node_modules/react',
    '^react-native$': '<rootDir>/node_modules/react-native',
    // Alias direct vers le code source des packages partagés (même logique que l'alias Vitest
    // côté web) : évite de dépendre de la transformation Babel des packages du monorepo dans Jest.
    '^@app/auth-core$': '<rootDir>/../packages/auth-core/src/index.ts',
    '^@app/annonces-core$': '<rootDir>/../packages/annonces-core/src/index.ts',
    '^@app/historique-core$': '<rootDir>/../packages/historique-core/src/index.ts',
    '^@app/messagerie-core$': '<rootDir>/../packages/messagerie-core/src/index.ts',
    '^@app/notation-core$': '<rootDir>/../packages/notation-core/src/index.ts',
    '^@app/notification-core$': '<rootDir>/../packages/notification-core/src/index.ts',
    '^@app/paiement-core$': '<rootDir>/../packages/paiement-core/src/index.ts',
    '^@app/parrainage-core$': '<rootDir>/../packages/parrainage-core/src/index.ts',
    '^@app/recherche-core$': '<rootDir>/../packages/recherche-core/src/index.ts',
    '^@app/reservation-core$': '<rootDir>/../packages/reservation-core/src/index.ts',
    '^@app/shared$': '<rootDir>/../packages/shared/src/index.ts',
  },
};
