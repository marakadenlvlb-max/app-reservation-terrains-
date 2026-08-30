import { useCallback, useState } from 'react';
import type { LoginPayload } from './types';
import { type LoginValidationErrors, hasValidationErrors, validateLoginPayload } from './validation';
import { loginUser } from './loginApi';
import type { SessionStorage } from './session';

export interface UseLoginFormOptions {
  apiBaseUrl: string;
  sessionStorage: SessionStorage;
  onSuccess?: (utilisateurId: string) => void;
}

export interface UseLoginFormResult {
  identifiant: string;
  motDePasse: string;
  errors: LoginValidationErrors;
  submitting: boolean;
  submitError: string | null;
  setIdentifiant: (value: string) => void;
  setMotDePasse: (value: string) => void;
  submit: () => Promise<void>;
}

/**
 * Logique de connexion partagée entre web et mobile — US-02 / RF-002. Même principe "headless"
 * que useRegisterForm (US-01) : la validation, l'appel API et l'écriture du token de session sont
 * partagés, seule l'UI change entre les deux plateformes.
 */
export function useLoginForm({
  apiBaseUrl,
  sessionStorage,
  onSuccess,
}: UseLoginFormOptions): UseLoginFormResult {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const payload: LoginPayload = { identifiant, motDePasse };
    const validationErrors = validateLoginPayload(payload);
    setErrors(validationErrors);
    setSubmitError(null);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginUser(payload, apiBaseUrl);
      await sessionStorage.setToken(result.token);
      onSuccess?.(result.utilisateurId);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Une erreur inattendue s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }, [identifiant, motDePasse, apiBaseUrl, sessionStorage, onSuccess]);

  return {
    identifiant,
    motDePasse,
    errors,
    submitting,
    submitError,
    setIdentifiant,
    setMotDePasse,
    submit,
  };
}
