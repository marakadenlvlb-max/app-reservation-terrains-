import { useCallback, useEffect, useState } from 'react';
import type { CreateCreneauPayload, Creneau, UpdateCreneauPayload } from './types';
import {
  type CreateCreneauValidationErrors,
  hasValidationErrors,
  validateCreateCreneauPayload,
} from './validation';
import { createCreneau, deleteCreneau, fetchCreneaux, updateCreneau as updateCreneauApi } from './creneauApi';

/** Un créneau réservé (RF-010) ne doit plus pouvoir être modifié ni retiré côté propriétaire. */
function isReserve(creneau: Creneau | undefined): boolean {
  return creneau?.statut === 'reserve';
}

export interface UseCreneauxOptions {
  terrainId: string;
  apiBaseUrl: string;
  /** Token de session (US-02) — null tant qu'il n'est pas encore lu depuis le stockage local. */
  token: string | null;
}

export interface UseCreneauxResult {
  creneaux: Creneau[];
  loading: boolean;
  loadError: string | null;
  debut: string;
  fin: string;
  /** Texte saisi tel quel (input contrôlé) ; converti en nombre au moment de la validation. */
  tarif: string;
  errors: CreateCreneauValidationErrors;
  submitting: boolean;
  submitError: string | null;
  setDebut: (value: string) => void;
  setFin: (value: string) => void;
  setTarif: (value: string) => void;
  addCreneau: () => Promise<void>;
  /** Id du créneau en cours de modification, ou `null` — utile pour désactiver son bouton "Enregistrer" pendant l'appel. */
  updatingId: string | null;
  updateError: string | null;
  /** Renvoie `true` en cas de succès — permet à l'appelant de savoir s'il peut refermer son mode édition. */
  updateCreneau: (creneauId: string, payload: UpdateCreneauPayload) => Promise<boolean>;
  removingId: string | null;
  removeError: string | null;
  removeCreneau: (creneauId: string) => Promise<boolean>;
}

/**
 * Chargement de la liste des créneaux d'un terrain, ajout (US-05), modification et retrait
 * (US-06) d'un créneau existant. Partagé entre web et mobile.
 */
export function useCreneaux({ terrainId, apiBaseUrl, token }: UseCreneauxOptions): UseCreneauxResult {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [tarif, setTarif] = useState('');
  const [errors, setErrors] = useState<CreateCreneauValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadError('Connecte-toi pour gérer les créneaux de ce terrain.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchCreneaux(terrainId, apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setCreneaux(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Impossible de charger les créneaux.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [terrainId, apiBaseUrl, token]);

  const addCreneau = useCallback(async () => {
    if (!token) return;

    const payload: CreateCreneauPayload = {
      terrainId,
      debut,
      fin,
      // Number('') vaut 0, ce que la validation rejette déjà (tarif <= 0) — pas besoin de gérer
      // le cas "champ vide" séparément du cas "tarif invalide".
      tarif: Number(tarif),
    };
    const validationErrors = validateCreateCreneauPayload(payload);
    setErrors(validationErrors);
    setSubmitError(null);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCreneau(payload, apiBaseUrl, token);
      setCreneaux((current) => [...current, created]);
      setDebut('');
      setFin('');
      setTarif('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "L'ajout du créneau a échoué.");
    } finally {
      setSubmitting(false);
    }
  }, [terrainId, debut, fin, tarif, apiBaseUrl, token]);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Les deux renvoient un booléen de succès (plutôt qu'un simple void) pour que l'UI (voir
  // CreneauRow côté web) sache si elle peut refermer son mode édition, ou doit le laisser ouvert
  // pour que l'utilisateur voie l'erreur et corrige sans ressaisir ses valeurs.
  const updateCreneauFn = useCallback(
    async (creneauId: string, payload: UpdateCreneauPayload): Promise<boolean> => {
      if (!token) return false;

      if (isReserve(creneaux.find((c) => c.id === creneauId))) {
        setUpdateError('Ce créneau est déjà réservé : il ne peut plus être modifié.');
        return false;
      }

      if (hasValidationErrors(validateCreateCreneauPayload(payload))) {
        setUpdateError('Vérifie les dates et le tarif saisis.');
        return false;
      }

      setUpdatingId(creneauId);
      setUpdateError(null);
      try {
        const updated = await updateCreneauApi(creneauId, payload, apiBaseUrl, token);
        setCreneaux((current) => current.map((c) => (c.id === creneauId ? updated : c)));
        return true;
      } catch (error) {
        setUpdateError(error instanceof Error ? error.message : 'La modification a échoué.');
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [creneaux, apiBaseUrl, token]
  );

  const removeCreneauFn = useCallback(
    async (creneauId: string): Promise<boolean> => {
      if (!token) return false;

      if (isReserve(creneaux.find((c) => c.id === creneauId))) {
        setRemoveError('Ce créneau est déjà réservé : il ne peut plus être retiré.');
        return false;
      }

      setRemovingId(creneauId);
      setRemoveError(null);
      try {
        await deleteCreneau(creneauId, apiBaseUrl, token);
        setCreneaux((current) => current.filter((c) => c.id !== creneauId));
        return true;
      } catch (error) {
        setRemoveError(error instanceof Error ? error.message : 'Le retrait a échoué.');
        return false;
      } finally {
        setRemovingId(null);
      }
    },
    [creneaux, apiBaseUrl, token]
  );

  return {
    creneaux,
    loading,
    loadError,
    debut,
    fin,
    tarif,
    errors,
    submitting,
    submitError,
    setDebut,
    setFin,
    setTarif,
    addCreneau,
    updatingId,
    updateError,
    updateCreneau: updateCreneauFn,
    removingId,
    removeError,
    removeCreneau: removeCreneauFn,
  };
}
