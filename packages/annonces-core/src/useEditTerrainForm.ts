import { useCallback, useEffect, useState } from 'react';
import type { Sport } from '@app/shared';
import type { Equipement, PalierAnnulation, Terrain, UpdateTerrainPayload } from './types';
import {
  type CreateTerrainValidationErrors,
  hasValidationErrors,
  validateCreateTerrainPayload,
} from './validation';
import { deleteTerrain, fetchTerrain, updateTerrain } from './terrainApi';

export interface UseEditTerrainFormOptions {
  terrainId: string;
  apiBaseUrl: string;
  /** Token de session (US-02) — null tant qu'il n'est pas encore lu depuis le stockage local. */
  token: string | null;
  onDeleted?: () => void;
}

export interface UseEditTerrainFormResult {
  loading: boolean;
  loadError: string | null;
  sport: Sport | null;
  adresse: string;
  type: string;
  equipements: Equipement[];
  paliers: PalierAnnulation[];
  /** `''` tant que le propriétaire n'a pas explicitement saisi sa propre valeur (voir `save`). */
  fraisAnnulationPourcentage: string;
  errors: CreateTerrainValidationErrors;
  saving: boolean;
  saveError: string | null;
  saved: boolean;
  deleting: boolean;
  deleteError: string | null;
  setSport: (sport: Sport) => void;
  setAdresse: (value: string) => void;
  setType: (value: string) => void;
  toggleEquipement: (equipement: Equipement) => void;
  addPalier: () => void;
  updatePalier: (index: number, palier: PalierAnnulation) => void;
  removePalier: (index: number) => void;
  setFraisAnnulationPourcentage: (value: string) => void;
  /** Revient explicitement au taux par défaut calculé par le backend (RF-021) — distinct de
   * laisser le champ inchangé : ça redéclenche le calcul et l'avertissement côté backend. */
  reinitialiserFraisAnnulation: () => void;
  save: () => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * Chargement + modification + retrait d'une annonce déjà publiée — US-06. Réutilise la même
 * validation que la création (useCreateTerrainForm, US-04) puisque ce sont les mêmes champs.
 *
 * RF-021 (correction du 9 septembre 2026) : `paliers` est toujours renvoyé au complet (comme
 * `equipements`). `fraisAnnulationPourcentage` distingue trois états dans le payload envoyé —
 * absent (le champ n'a jamais été touché depuis le chargement), explicitement `null` (reset
 * demandé via `reinitialiserFraisAnnulation`), ou une valeur (le propriétaire l'a modifié) — voir
 * ModifierAnnonce côté backend pour la raison : un simple champ vide renvoyé comme `null` à
 * chaque sauvegarde redéclencherait à tort un avertissement.
 */
export function useEditTerrainForm({
  terrainId,
  apiBaseUrl,
  token,
  onDeleted,
}: UseEditTerrainFormOptions): UseEditTerrainFormResult {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sport, setSport] = useState<Sport | null>(null);
  const [adresse, setAdresse] = useState('');
  const [type, setType] = useState('');
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [paliers, setPaliers] = useState<PalierAnnulation[]>([]);
  const [fraisAnnulationPourcentage, setFraisAnnulationPourcentageState] = useState('');
  // Distingue "jamais touché depuis le chargement" (payload n'inclut pas le champ) de "touché,
  // même si la valeur affichée est identique à l'originale" — voir le commentaire de `save`.
  const [fraisAnnulationTouche, setFraisAnnulationTouche] = useState(false);
  const [errors, setErrors] = useState<CreateTerrainValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadError('Connecte-toi pour gérer cette annonce.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchTerrain(terrainId, apiBaseUrl, token)
      .then((terrain: Terrain) => {
        if (cancelled) return;
        setSport(terrain.sport);
        setAdresse(terrain.adresse);
        setType(terrain.type ?? '');
        setEquipements(terrain.equipements);
        setPaliers(terrain.paliers ?? []);
        setFraisAnnulationPourcentageState(terrain.fraisAnnulationPourcentage != null ? String(terrain.fraisAnnulationPourcentage) : '');
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Impossible de charger l'annonce.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [terrainId, apiBaseUrl, token]);

  const toggleEquipement = useCallback((equipement: Equipement) => {
    setEquipements((current) =>
      current.includes(equipement) ? current.filter((e) => e !== equipement) : [...current, equipement]
    );
  }, []);

  const addPalier = useCallback(() => {
    setPaliers((current) => [...current, { delaiMinutes: 0, pourcentageRemboursement: 0 }]);
  }, []);

  const updatePalier = useCallback((index: number, palier: PalierAnnulation) => {
    setPaliers((current) => current.map((p, i) => (i === index ? palier : p)));
  }, []);

  const removePalier = useCallback((index: number) => {
    setPaliers((current) => current.filter((_, i) => i !== index));
  }, []);

  const setFraisAnnulationPourcentage = useCallback((value: string) => {
    setFraisAnnulationTouche(true);
    setFraisAnnulationPourcentageState(value);
  }, []);

  const reinitialiserFraisAnnulation = useCallback(() => {
    setFraisAnnulationTouche(true);
    setFraisAnnulationPourcentageState('');
  }, []);

  const save = useCallback(async () => {
    if (!token) return;

    const payload: UpdateTerrainPayload = {
      sport: sport as Sport,
      adresse,
      type: type.trim() || undefined,
      equipements,
      paliers,
      // Champ jamais touché depuis le chargement : on l'omet du payload pour que le backend ne
      // touche pas au taux existant (évite un avertissement à chaque sauvegarde, voir le
      // commentaire d'en-tête). Touché : chaîne vide => reset explicite vers le taux par défaut.
      ...(fraisAnnulationTouche
        ? { fraisAnnulationPourcentage: fraisAnnulationPourcentage.trim() === '' ? null : Number(fraisAnnulationPourcentage) }
        : {}),
    };
    const validationErrors = validateCreateTerrainPayload(payload);
    setErrors(validationErrors);
    setSaveError(null);
    setSaved(false);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setSaving(true);
    try {
      const terrain = await updateTerrain(terrainId, payload, apiBaseUrl, token);
      setFraisAnnulationPourcentageState(String(terrain.fraisAnnulationPourcentage));
      setFraisAnnulationTouche(false);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'La modification a échoué.');
    } finally {
      setSaving(false);
    }
  }, [terrainId, sport, adresse, type, equipements, paliers, fraisAnnulationPourcentage, fraisAnnulationTouche, apiBaseUrl, token]);

  const remove = useCallback(async () => {
    if (!token) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTerrain(terrainId, apiBaseUrl, token);
      onDeleted?.();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Le retrait a échoué.');
    } finally {
      setDeleting(false);
    }
  }, [terrainId, apiBaseUrl, token, onDeleted]);

  return {
    loading,
    loadError,
    sport,
    adresse,
    type,
    equipements,
    paliers,
    fraisAnnulationPourcentage,
    errors,
    saving,
    saveError,
    saved,
    deleting,
    deleteError,
    setSport,
    setAdresse,
    setType,
    toggleEquipement,
    addPalier,
    updatePalier,
    removePalier,
    setFraisAnnulationPourcentage,
    reinitialiserFraisAnnulation,
    save,
    remove,
  };
}
