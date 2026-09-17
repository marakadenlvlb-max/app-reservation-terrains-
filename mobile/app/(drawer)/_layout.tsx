import { useEffect } from 'react';
import { View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { useSessionToken } from '@app/auth-core';
import { mobileSessionStorage } from '../../src/modules/authentification/sessionStorage';
import { LogoutButton } from '../../src/modules/authentification/components/LogoutButton';

/**
 * Menu tiroir — US-29 (module Navigation & Interface globale, équivalent mobile d'US-27/28).
 * 8 écrans + Déconnexion, même liste que NavBar côté web (Parrainage regroupé sous Profil, pas
 * une entrée à part — voir app/(drawer)/profil.tsx). Choix du menu tiroir plutôt qu'une barre
 * d'onglets : validé explicitement (9 destinations à plat ne tiennent pas dans une tab bar).
 *
 * Redirige vers `/connexion` si aucune session n'est détectée — même logique de masquage que
 * NavBar côté web (protection côté UX seulement, l'API reste seule juge de l'autorisation réelle).
 */
export default function DrawerLayout() {
  const router = useRouter();
  const token = useSessionToken(mobileSessionStorage);

  useEffect(() => {
    if (token === undefined) return; // pas encore résolu (voir useSessionToken)
    if (!token) router.replace('/connexion');
  }, [token, router]);

  if (!token) return null;

  return (
    <Drawer drawerContent={DrawerContent} screenOptions={{ headerShown: true }}>
      <Drawer.Screen name="accueil" options={{ title: 'Accueil', drawerLabel: 'Accueil' }} />
      <Drawer.Screen name="recherche" options={{ title: 'Recherche', drawerLabel: 'Recherche' }} />
      <Drawer.Screen
        name="recommandations"
        options={{ title: 'Recommandations', drawerLabel: 'Recommandations' }}
      />
      <Drawer.Screen name="mes-annonces" options={{ title: 'Mes annonces', drawerLabel: 'Mes annonces' }} />
      <Drawer.Screen
        name="historique/joueur"
        options={{ title: 'Mes réservations', drawerLabel: 'Mes réservations' }}
      />
      <Drawer.Screen name="messagerie" options={{ title: 'Messagerie', drawerLabel: 'Messagerie' }} />
      <Drawer.Screen name="notifications" options={{ title: 'Notifications', drawerLabel: 'Notifications' }} />
      <Drawer.Screen name="profil" options={{ title: 'Profil', drawerLabel: 'Profil' }} />
    </Drawer>
  );
}

/** Déconnexion en pied de tiroir plutôt qu'un item de routage (même placement que NavBar, web). */
function DrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <View className="mt-4 px-4">
        <LogoutButton />
      </View>
    </DrawerContentScrollView>
  );
}
