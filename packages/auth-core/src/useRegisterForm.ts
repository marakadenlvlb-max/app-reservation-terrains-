import { useCallback, useState } from 'react';
import type { RegisterPayload, Sport } from './types';
import { type RegisterValidationErrors, hasValidationErrors, validateRegisterPayload } from './validation';
import { registerUser } from './registerApi';

export interface UseRegisterFormOptions {
  apiBaseUrl: string;
  onSuccess?: (utilisateurId: string) => void;
}

export interface UseRegisterFormResult {
  identifiant: string;
  motDePasse: string;
  sports: Sport[];
  errors: RegisterValidationErrors;
  submitting: boolean;
  submitError: string | null;
  setIdentifiant: (value: string) => void;
  setMotDePasse: (value: string) => void;
  toggleSport: (sport: Sport) => void;
  submit: () => Promise<void>;
}

/**
 * Logique d'inscription partagée entre web (Next.js) et mobile (React Native) — US-01 / RF-001.
 *
 * Volontairement "headless" : ce hook ne rend aucun JSX. Chaque plateforme garde ses propres
 * primitives d'UI (input HTML vs TextInput React Native) tout en réutilisant la même validation
 * et le même appel API — c'est exactement le bénéfice de "logique métier réutilisable" mis en
 * avant dans architecture.md pour justifier le choix TypeScript partagé entre web et mobile.
 */
export function useRegisterForm({
  apiBaseUrl,
  onSuccess,
}: UseRegisterFormOptions): UseRegisterFormResult {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [errors, setErrors] = useState<RegisterValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleSport = useCallback((sport: Sport) => {
    setSports((current) =>
      current.includes(sport) ? current.filter((s) => s !== sport) : [...current, sport]
    );
  }, []);

  const submit = useCallback(async () => {
    const payload: RegisterPayload = { identifiant, motDePasse, sports };
    const validationErrors = validateRegisterPayload(payload);
    setErrors(validationErrors);
    setSubmitError(null);

    if (hasValidationErrors(validationErrors)) {
      // On n'appelle pas l'API tant que le formulaire n'est pas valide côté client — évite un
      // aller-retour réseau inutile pour une erreur déjà détectable localement.
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerUser(payload, apiBaseUrl);
      onSuccess?.(result.utilisateurId);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Une erreur inattendue s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }, [identifiant, motDePasse, sports, apiBaseUrl, onSuccess]);

  return {
    identifiant,
    motDePasse,
    sports,
    errors,
    submitting,
    submitError,
    setIdentifiant,
    setMotDePasse,
    toggleSport,
    submit,
  };
}
