import { useCallback, useState } from 'react';
import type { Equipement, Sport } from '@app/shared';
import type { RechercheFiltres, RechercheResultat } from './types';
import { searchTerrains } from './rechercheApi';

export interface Position {
  latitude: number;
  longitude: number;
}

export interface UseRechercheTerrainsOptions {
  apiBaseUrl: string;
}

export interface UseRechercheTerrainsResult {
  sport: Sport | null;
  localisation: string;
  date: string;
  heure: string;
  /** Position GPS de l'utilisateur (US-09) — `null` tant que le tri par proximité n'a pas été activé. */
  position: Position | null;
  /** Champ texte contrôlé (pas encore parsé en nombre) — cohérent avec `date`/`heure` ci-dessus. */
  prixMax: string;
  /** Idem `prixMax`. N'est envoyé au backend que si `position` est renseignée (voir `search`) : filtrer par distance sans position de référence n'a pas de sens (RF-022). */
  distanceMaxKm: string;
  equipements: Equipement[];
  resultats: RechercheResultat[];
  /** `true` uniquement après une première recherche lancée — permet de distinguer "pas encore cherché" de "recherche sans résultat". */
  hasSearched: boolean;
  searching: boolean;
  searchError: string | null;
  setSport: (sport: Sport | null) => void;
  setLocalisation: (value: string) => void;
  setDate: (value: string) => void;
  setHeure: (value: string) => void;
  setPosition: (position: Position | null) => void;
  setPrixMax: (value: string) => void;
  setDistanceMaxKm: (value: string) => void;
  toggleEquipement: (equipement: Equipement) => void;
  /**
   * `overridePosition` permet de lancer une recherche avec une position qui vient tout juste
   * d'être acquise (ex. callback de géolocalisation) sans attendre le prochain rendu : appeler
   * `setPosition(p)` puis `search()` dans la foulée utiliserait encore l'ancienne valeur de
   * `position`, capturée dans la closure de ce `search` avant que le re-rendu ne se produise.
   */
  search: (overridePosition?: Position) => Promise<void>;
}

/**
 * Recherche de terrains disponibles — US-07 / RF-007 (sport, localisation) + RF-008 (date,
 * heure) + US-09 (tri par proximité). Partagé entre web et mobile. Pas de validation bloquante :
 * contrairement aux formulaires des modules précédents, une recherche sans filtre est un usage
 * normal (parcourir le catalogue), donc rien n'empêche d'appeler `search()` avec des champs vides.
 *
 * L'acquisition de la position (capteur GPS) est spécifique à chaque plateforme (API Geolocation
 * du navigateur vs expo-location) — ce hook se contente de recevoir la position déjà obtenue via
 * `setPosition` et de l'inclure dans la recherche, sans savoir comment elle a été acquise.
 */
export function useRechercheTerrains({ apiBaseUrl }: UseRechercheTerrainsOptions): UseRechercheTerrainsResult {
  const [sport, setSport] = useState<Sport | null>(null);
  const [localisation, setLocalisation] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [prixMax, setPrixMax] = useState('');
  const [distanceMaxKm, setDistanceMaxKm] = useState('');
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [resultats, setResultats] = useState<RechercheResultat[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const toggleEquipement = useCallback((equipement: Equipement) => {
    setEquipements((prev) => (prev.includes(equipement) ? prev.filter((e) => e !== equipement) : [...prev, equipement]));
  }, []);

  const search = useCallback(async (overridePosition?: Position) => {
    const effectivePosition = overridePosition ?? position;
    const filtres: RechercheFiltres = {
      sport: sport ?? undefined,
      localisation: localisation.trim() || undefined,
      date: date || undefined,
      heure: heure || undefined,
      latitude: effectivePosition?.latitude,
      longitude: effectivePosition?.longitude,
      prixMax: prixMax ? Number(prixMax) : undefined,
      // Voir le commentaire sur `distanceMaxKm` dans UseRechercheTerrainsResult : omis en
      // silence sans position plutôt que d'envoyer un filtre inapplicable au backend.
      distanceMaxKm: effectivePosition && distanceMaxKm ? Number(distanceMaxKm) : undefined,
      equipements: equipements.length > 0 ? equipements : undefined,
    };

    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchTerrains(filtres, apiBaseUrl);
      setResultats(results);
      setHasSearched(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'La recherche a échoué.');
    } finally {
      setSearching(false);
    }
  }, [sport, localisation, date, heure, position, prixMax, distanceMaxKm, equipements, apiBaseUrl]);

  return {
    sport,
    localisation,
    date,
    heure,
    position,
    prixMax,
    distanceMaxKm,
    equipements,
    resultats,
    hasSearched,
    searching,
    searchError,
    setSport,
    setLocalisation,
    setDate,
    setHeure,
    setPosition,
    setPrixMax,
    setDistanceMaxKm,
    toggleEquipement,
    search,
  };
}
