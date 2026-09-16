'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionToken } from '@app/auth-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

/**
 * US-28 (module Navigation & Interface globale) : `/` n'avait aucune page — un visiteur qui
 * arrivait à froid sur le site (pas de lien connu, pas de session) tombait sur un 404. Cette
 * page ne rend rien d'observable, elle redirige immédiatement vers `/accueil` (session détectée)
 * ou `/connexion` (aucune session), comme le fait déjà NavBar pour décider de s'afficher.
 */
export function RootRedirect() {
  const router = useRouter();
  const token = useSessionToken(webSessionStorage);

  useEffect(() => {
    if (token === undefined) return; // pas encore résolu (voir useSessionToken)
    router.replace(token ? '/accueil' : '/connexion');
  }, [token, router]);

  return null;
}
