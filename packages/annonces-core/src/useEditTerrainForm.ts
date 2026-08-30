import { useCallback, useEffect, useState } from 'react';
import type { Sport } from '@app/shared';
import type { Equipement, Terrain, UpdateTerrainPayload } from './types';
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
  save: () => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * Chargement + modification + retrait d'une annonce déjà publiée — US-06. Réutilise la même
 * validation que la création (useCreateTerrainForm, US-04) puisque ce sont les mêmes champs.
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

  const save = useCallback(async () => {
    if (!token) return;

    const payload: UpdateTerrainPayload = {
      sport: sport as Sport,
      adresse,
      type: type.trim() || undefined,
      equipements,
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
      await updateTerrain(terrainId, payload, apiBaseUrl, token);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'La modification a échoué.');
    } finally {
      setSaving(false);
    }
  }, [terrainId, sport, adresse, type, equipements, apiBaseUrl, token]);

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
    save,
    remove,
  };
}
