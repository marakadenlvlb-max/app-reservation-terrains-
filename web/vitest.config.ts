import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias direct vers le code source des packages partagés plutôt que de dépendre de la
      // résolution node_modules : évite à Vite de devoir pré-bundler des packages TS non compilés.
      '@app/auth-core': path.resolve(__dirname, '../packages/auth-core/src/index.ts'),
      '@app/annonces-core': path.resolve(__dirname, '../packages/annonces-core/src/index.ts'),
      '@app/historique-core': path.resolve(__dirname, '../packages/historique-core/src/index.ts'),
      '@app/messagerie-core': path.resolve(__dirname, '../packages/messagerie-core/src/index.ts'),
      '@app/notation-core': path.resolve(__dirname, '../packages/notation-core/src/index.ts'),
      '@app/notification-core': path.resolve(__dirname, '../packages/notification-core/src/index.ts'),
      '@app/paiement-core': path.resolve(__dirname, '../packages/paiement-core/src/index.ts'),
      '@app/parrainage-core': path.resolve(__dirname, '../packages/parrainage-core/src/index.ts'),
      '@app/recherche-core': path.resolve(__dirname, '../packages/recherche-core/src/index.ts'),
      '@app/reservation-core': path.resolve(__dirname, '../packages/reservation-core/src/index.ts'),
      '@app/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
