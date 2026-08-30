/** @type {import('next').NextConfig} */
const nextConfig = {
  // Packages du monorepo distribués en TypeScript source (pas de build préalable) —
  // transpilePackages permet à Next.js de les compiler comme le reste de l'app.
  transpilePackages: [
    '@app/auth-core',
    '@app/annonces-core',
    '@app/historique-core',
    '@app/notation-core',
    '@app/paiement-core',
    '@app/recherche-core',
    '@app/reservation-core',
    '@app/shared',
  ],
};

module.exports = nextConfig;
