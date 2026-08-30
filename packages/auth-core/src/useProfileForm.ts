import { useCallback, useEffect, useState } from 'react';
import type { Profile, Sport, UpdateProfilePayload } from './types';
import { type ProfileValidationErrors, hasValidationErrors, validateProfilePayload } from './validation';
import { fetchProfile, updateProfile } from './profileApi';

export interface UseProfileFormOptions {
  apiBaseUrl: string;
  /** Token de session (US-02) — null tant qu'il n'est pas encore lu depuis le stockage local. */
  token: string | null;
}

export interface UseProfileFormResult {
  loading: boolean;
  loadError: string | null;
  nom: string;
  ville: string;
  sports: Sport[];
  photoUrl: string | null;
  errors: ProfileValidationErrors;
  saving: boolean;
  saveError: string | null;
  saved: boolean;
  setNom: (value: string) => void;
  setVille: (value: string) => void;
  toggleSport: (sport: Sport) => void;
  /** Permet de refléter immédiatement une photo tout juste uploadée (voir usePhotoUpload). */
  setPhotoUrl: (url: string | null) => void;
  save: () => Promise<void>;
}

/**
 * Chargement + édition du profil — US-03 / RF-003. Partagé entre web et mobile : seule l'UI
 * (formulaire web vs écran natif) diffère entre les deux plateformes.
 */
export function useProfileForm({ apiBaseUrl, token }: UseProfileFormOptions): UseProfileFormResult {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      // Le token n'est pas encore résolu (lecture asynchrone du stockage local) ou l'utilisateur
      // n'est pas connecté : on ne tente pas l'appel API tant qu'on n'a rien à envoyer.
      setLoading(false);
      setLoadError('Connecte-toi pour accéder à ton profil.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchProfile(apiBaseUrl, token)
      .then((profile: Profile) => {
        if (cancelled) return;
        setNom(profile.nom);
        setVille(profile.ville);
        setSports(profile.sports);
        setPhotoUrl(profile.photoUrl);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Impossible de charger le profil.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  const toggleSport = useCallback((sport: Sport) => {
    setSports((current) =>
      current.includes(sport) ? current.filter((s) => s !== sport) : [...current, sport]
    );
  }, []);

  const save = useCallback(async () => {
    if (!token) return;

    const payload: UpdateProfilePayload = { nom, ville, sports };
    const validationErrors = validateProfilePayload(payload);
    setErrors(validationErrors);
    setSaveError(null);
    setSaved(false);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setSaving(true);
    try {
      await updateProfile(payload, apiBaseUrl, token);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'La mise à jour a échoué.');
    } finally {
      setSaving(false);
    }
  }, [nom, ville, sports, apiBaseUrl, token]);

  return {
    loading,
    loadError,
    nom,
    ville,
    sports,
    photoUrl,
    errors,
    saving,
    saveError,
    saved,
    setNom,
    setVille,
    toggleSport,
    setPhotoUrl,
    save,
  };
}
