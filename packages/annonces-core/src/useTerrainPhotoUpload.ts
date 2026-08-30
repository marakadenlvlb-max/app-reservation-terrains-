import { useCallback, useState } from 'react';
import { uploadTerrainPhoto } from './terrainApi';

export interface UseTerrainPhotoUploadOptions {
  apiBaseUrl: string;
  token: string | null;
  onUploaded?: (photoUrl: string) => void;
}

export interface UseTerrainPhotoUploadResult {
  uploading: boolean;
  error: string | null;
  upload: (terrainId: string, formData: FormData) => Promise<void>;
}

/**
 * Upload des photos d'un terrain — US-04 / RF-004. Même principe que usePhotoUpload côté profil
 * (US-03) : la construction du FormData appartient à chaque plateforme, ce hook ne fait que
 * l'appel réseau et son état de chargement.
 */
export function useTerrainPhotoUpload({
  apiBaseUrl,
  token,
  onUploaded,
}: UseTerrainPhotoUploadOptions): UseTerrainPhotoUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (terrainId: string, formData: FormData) => {
      if (!token) return;

      setUploading(true);
      setError(null);
      try {
        const result = await uploadTerrainPhoto(terrainId, formData, apiBaseUrl, token);
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
