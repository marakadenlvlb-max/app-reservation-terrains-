module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    // Alias direct vers le code source des packages partagés (même logique que l'alias Vitest
    // côté web) : évite de dépendre de la transformation Babel des packages du monorepo dans Jest.
    '^@app/auth-core$': '<rootDir>/../packages/auth-core/src/index.ts',
    '^@app/annonces-core$': '<rootDir>/../packages/annonces-core/src/index.ts',
    '^@app/historique-core$': '<rootDir>/../packages/historique-core/src/index.ts',
    '^@app/notation-core$': '<rootDir>/../packages/notation-core/src/index.ts',
    '^@app/paiement-core$': '<rootDir>/../packages/paiement-core/src/index.ts',
    '^@app/recherche-core$': '<rootDir>/../packages/recherche-core/src/index.ts',
    '^@app/reservation-core$': '<rootDir>/../packages/reservation-core/src/index.ts',
    '^@app/shared$': '<rootDir>/../packages/shared/src/index.ts',
  },
};
