import { useCallback, useState } from 'react';
import { uploadProfilePhoto } from './profileApi';

export interface UsePhotoUploadOptions {
  apiBaseUrl: string;
  token: string | null;
  onUploaded?: (photoUrl: string) => void;
}

export interface UsePhotoUploadResult {
  uploading: boolean;
  error: string | null;
  upload: (formData: FormData) => Promise<void>;
}

/**
 * Upload de la photo de profil — US-03 / RF-003. Séparé de useProfileForm car la construction du
 * FormData appartient à chaque plateforme (voir le commentaire dans profileApi.ts) ; ce hook ne
 * gère que l'appel réseau et son état de chargement, identique des deux côtés.
 */
export function usePhotoUpload({
  apiBaseUrl,
  token,
  onUploaded,
}: UsePhotoUploadOptions): UsePhotoUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (formData: FormData) => {
      if (!token) return;

      setUploading(true);
      setError(null);
      try {
        const result = await uploadProfilePhoto(formData, apiBaseUrl, token);
        onUploaded?.(result.photoUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'envoi de la photo a échoué.");
      } finally {
        setUploading(false);
      }
    },
    [apiBaseUrl, token, onUploaded]
  );

  return { uploading, error, upload };
}
