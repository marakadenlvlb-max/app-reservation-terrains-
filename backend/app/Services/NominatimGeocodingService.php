<?php

namespace App\Services;

use App\Contracts\GeocodingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Implémentation par défaut de GeocodingService via l'API de recherche de OpenStreetMap
 * Nominatim — cité explicitement comme option dans architecture.md section 4 ("Service de
 * géolocalisation (ex. Mapbox / OpenStreetMap)"), retenu ici plutôt que Mapbox car il ne demande
 * aucune clé d'API (juste un User-Agent identifiable, exigé par sa politique d'usage), ce qui
 * évite une dépendance à un compte/des identifiants pour faire fonctionner cet endpoint.
 *
 * Non vérifié contre le vrai service Nominatim dans cet environnement de développement (pas
 * d'accès réseau sortant garanti) — les tests Pest stubbent cette dépendance via `Http::fake()`
 * plutôt que d'appeler le service réel (voir tests/Feature/Annonces/TerrainTest.php).
 */
class NominatimGeocodingService implements GeocodingService
{
    public function geocoder(string $adresse): array
    {
        try {
            $reponse = Http::withHeaders(['User-Agent' => 'terrains-de-sport-app'])
                ->timeout(5)
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $adresse,
                    'format' => 'json',
                    'limit' => 1,
                ]);

            $premierResultat = $reponse->json('0');

            if (! $reponse->successful() || ! $premierResultat) {
                return ['latitude' => null, 'longitude' => null];
            }

            return [
                'latitude' => (float) $premierResultat['lat'],
                'longitude' => (float) $premierResultat['lon'],
            ];
        } catch (Throwable $e) {
            // Un échec de géocodage (réseau, timeout, réponse inattendue) ne doit jamais faire
            // échouer la publication/modification de l'annonce elle-même — voir GeocodingService.
            Log::warning('Géocodage échoué', ['adresse' => $adresse, 'erreur' => $e->getMessage()]);

            return ['latitude' => null, 'longitude' => null];
        }
    }
}
