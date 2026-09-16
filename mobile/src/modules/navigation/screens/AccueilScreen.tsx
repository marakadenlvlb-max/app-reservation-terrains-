import { Text, View } from 'react-native';
import { Link } from 'expo-router';

/**
 * Accueil post-connexion — US-29 (module Navigation & Interface globale, équivalent mobile
 * d'US-27/28). Un seul écran combiné plutôt qu'un aiguillage par rôle : `UTILISATEUR` n'a pas de
 * champ `role` dans le modèle de données — un même compte peut être à la fois joueur et
 * propriétaire/gestionnaire, donc l'accueil donne accès aux deux univers sans distinction (même
 * décision qu'AccueilView côté web).
 */
export function AccueilScreen() {
  return (
    <View className="flex-1 justify-center gap-6 px-6">
      <Text className="text-xl font-semibold">Bienvenue</Text>
      <View className="gap-3">
        <Link href="/recherche" className="rounded border border-gray-300 px-4 py-3 font-medium">
          Trouver un terrain à réserver
        </Link>
        <Link href="/mes-annonces" className="rounded border border-gray-300 px-4 py-3 font-medium">
          Gérer mes annonces de terrain
        </Link>
        {/* Regroupé ici plutôt que dans le tiroir (même raison qu'AccueilView côté web) : aucun
            champ `role` n'existe pour réserver un lien du menu aux propriétaires/gestionnaires. */}
        <Link href="/reversements" className="text-sm text-blue-600">
          Voir mes reversements
        </Link>
      </View>
    </View>
  );
}
