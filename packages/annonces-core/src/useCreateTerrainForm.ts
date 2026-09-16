import { useCallback, useState } from 'react';
import type { Sport } from '@app/shared';
import type { CreateTerrainPayload, Equipement, PalierAnnulation, Terrain } from './types';
import {
  type CreateTerrainValidationErrors,
  hasValidationErrors,
  validateCreateTerrainPayload,
} from './validation';
import { createTerrain } from './terrainApi';

export interface UseCreateTerrainFormOptions {
  apiBaseUrl: string;
  /** Token de session (US-02) — null tant qu'il n'est pas encore lu depuis le stockage local. */
  token: string | null;
  onSuccess?: (terrain: Terrain) => void;
}

export interface UseCreateTerrainFormResult {
  sport: Sport | null;
  adresse: string;
  type: string;
  equipements: Equipement[];
  paliers: PalierAnnulation[];
  fraisAnnulationPourcentage: string;
  errors: CreateTerrainValidationErrors;
  submitting: boolean;
  submitError: string | null;
  setSport: (sport: Sport) => void;
  setAdresse: (value: string) => void;
  setType: (value: string) => void;
  toggleEquipement: (equipement: Equipement) => void;
  addPalier: () => void;
  updatePalier: (index: number, palier: PalierAnnulation) => void;
  removePalier: (index: number) => void;
  setFraisAnnulationPourcentage: (value: string) => void;
  submit: () => Promise<void>;
}

/**
 * Palier de départ proposé à l'ouverture du formulaire — juste une valeur de saisie initiale
 * modifiable par le propriétaire, pas une politique par défaut imposée par le backend (qui, lui,
 * refuse toute publication sans qu'au moins un palier soit explicitement soumis, RF-021).
 */
const PALIER_INITIAL: PalierAnnulation = { delaiMinutes: 1440, pourcentageRemboursement: 100 };

/**
 * Publication d'une annonce de terrain — US-04 / RF-004 (RF-005 pour un gestionnaire, mêmes
 * modalités). Partagé entre web et mobile ; l'upload des photos se fait séparément une fois le
 * terrain créé (voir useTerrainPhotoUpload) puisqu'il faut un `terrainId` pour les rattacher.
 *
 * RF-021 (correction du 9 septembre 2026) : `paliers` (politique d'annulation, illimitée) et
 * `fraisAnnulationPourcentage` (optionnel — vide laisse le backend calculer un taux par défaut et
 * avertir le propriétaire) font maintenant partie de la publication.
 */
export function useCreateTerrainForm({
  apiBaseUrl,
  token,
  onSuccess,
}: UseCreateTerrainFormOptions): UseCreateTerrainFormResult {
  const [sport, setSport] = useState<Sport | null>(null);
  const [adresse, setAdresse] = useState('');
  const [type, setType] = useState('');
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [paliers, setPaliers] = useState<PalierAnnulation[]>([PALIER_INITIAL]);
  const [fraisAnnulationPourcentage, setFraisAnnulationPourcentage] = useState('');
  const [errors, setErrors] = useState<CreateTerrainValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const submit = useCallback(async () => {
    if (!token) {
      setSubmitError('Connecte-toi pour publier une annonce.');
      return;
    }

    const payload: CreateTerrainPayload = {
      // `sport` peut être `null` tant que rien n'est sélectionné : le cast est sûr ici car
      // validateCreateTerrainPayload revérifie sa présence juste en dessous avant tout appel API.
      sport: sport as Sport,
      adresse,
      type: type.trim() || undefined,
      equipements,
      paliers,
      // Chaîne vide = pas de valeur saisie => laisser le backend calculer son taux par défaut.
      fraisAnnulationPourcentage: fraisAnnulationPourcentage.trim() === '' ? null : Number(fraisAnnulationPourcentage),
    };
    const validationErrors = validateCreateTerrainPayload(payload);
    setErrors(validationErrors);
    setSubmitError(null);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      const terrain = await createTerrain(payload, apiBaseUrl, token);
      onSuccess?.(terrain);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'La publication a échoué.');
    } finally {
      setSubmitting(false);
    }
  }, [sport, adresse, type, equipements, paliers, fraisAnnulationPourcentage, apiBaseUrl, token, onSuccess]);

  return {
    sport,
    adresse,
    type,
    equipements,
    paliers,
    fraisAnnulationPourcentage,
    errors,
    submitting,
    submitError,
    setSport,
    setAdresse,
    setType,
    toggleEquipement,
    addPalier,
    updatePalier,
    removePalier,
    setFraisAnnulationPourcentage,
    submit,
  };
}
