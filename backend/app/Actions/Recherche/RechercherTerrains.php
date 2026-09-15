<?php

namespace App\Actions\Recherche;

use App\Models\Creneau;
use Illuminate\Support\Collection;

/**
 * RF-007/RF-008 (US-07/US-09) + RF-022 (US-23) — recherche de créneaux réellement disponibles.
 * L'unité de résultat est le couple (terrain, créneau), pas le terrain seul : voir le commentaire
 * de `RechercheResultat` (types.ts), "les créneaux réellement disponibles" (RF-008).
 *
 * @param  array{sport?: string, localisation?: string, date?: string, heure?: string, latitude?: float, longitude?: float, prixMax?: float, distanceMaxKm?: float, equipements?: string}  $filtres
 */
class RechercherTerrains
{
    public function handle(array $filtres): array
    {
        $query = Creneau::query()
            ->where('statut', 'disponible')
            // Un créneau déjà commencé (ou passé) n'est plus "réellement disponible" à réserver,
            // même si son statut n'a pas encore été mécaniquement corrigé ailleurs.
            ->where('debut', '>', now())
            ->with('terrain');

        if (! empty($filtres['sport'])) {
            $query->whereHas('terrain', fn ($q) => $q->where('sport', $filtres['sport']));
        }

        if (! empty($filtres['localisation'])) {
            // Filtre texte libre sur l'adresse plutôt qu'un re-géocodage à la recherche : RF-007
            // ne précise pas de rayon associé à "localisation" (contrairement à la position GPS +
            // distanceMaxKm ci-dessous, qui elle a un rayon explicite) — un simple sous-texte
            // reste la lecture la plus honnête de "rechercher... par localisation".
            $query->whereHas('terrain', fn ($q) => $q->where('adresse', 'like', '%'.$filtres['localisation'].'%'));
        }

        if (! empty($filtres['date'])) {
            $query->whereDate('debut', $filtres['date']);
        }

        if (! empty($filtres['heure'])) {
            // "à cette heure ou plus tard" plutôt qu'une égalité stricte : un joueur qui cherche
            // un créneau à partir de 18h veut voir 18h30, 19h... pas seulement un créneau
            // commençant pile à 18:00:00, qui n'existerait presque jamais en pratique.
            $query->whereTime('debut', '>=', $filtres['heure']);
        }

        if (isset($filtres['prixMax'])) {
            $query->where('tarif', '<=', $filtres['prixMax']);
        }

        $equipementsRequis = $this->parserEquipements($filtres['equipements'] ?? null);

        $creneaux = $query->orderBy('debut')->get();

        if ($equipementsRequis->isNotEmpty()) {
            // Filtré en PHP plutôt qu'en SQL (whereJsonContains) : évite de dépendre du support
            // JSON de chaque moteur (les tests tournent sur SQLite en mémoire, indépendamment de
            // PostgreSQL en production — voir phpunit.xml) pour un jeu de données de toute façon
            // restreint (un catalogue de terrains, pas une table à des millions de lignes).
            $creneaux = $creneaux->filter(
                fn (Creneau $creneau) => $equipementsRequis->diff($creneau->terrain->equipements)->isEmpty()
            );
        }

        $positionFournie = isset($filtres['latitude'], $filtres['longitude']);

        $resultats = $creneaux->map(function (Creneau $creneau) use ($filtres, $positionFournie) {
            $terrain = $creneau->terrain;
            $distanceKm = $positionFournie && $terrain->latitude !== null && $terrain->longitude !== null
                ? $this->distanceKm((float) $filtres['latitude'], (float) $filtres['longitude'], $terrain->latitude, $terrain->longitude)
                : null;

            return [
                'terrainId' => $terrain->id,
                'sport' => $terrain->sport,
                'adresse' => $terrain->adresse,
                'type' => $terrain->type,
                'photoPrincipale' => $terrain->photos[0] ?? null,
                'creneauId' => $creneau->id,
                'debut' => $creneau->debut->toIso8601String(),
                'fin' => $creneau->fin->toIso8601String(),
                'tarif' => (float) $creneau->tarif,
                'equipements' => $terrain->equipements,
                // Clé absente (pas `null`) quand la distance n'est pas calculable : `distanceKm`
                // est un champ optionnel côté frontend (`?: number`), jamais `null` (types.ts).
                ...($distanceKm !== null ? ['distanceKm' => round($distanceKm, 1)] : []),
            ];
        });

        if (isset($filtres['distanceMaxKm'])) {
            // Un terrain dont la position est inconnue (géocodage échoué à la publication, voir
            // PublierAnnonce) ne peut pas être garanti "dans" le rayon demandé — exclu par
            // prudence plutôt qu'inclus par défaut dès qu'un filtre de distance est actif.
            $resultats = $resultats->filter(
                fn (array $resultat) => isset($resultat['distanceKm']) && $resultat['distanceKm'] <= $filtres['distanceMaxKm']
            );
        }

        if ($positionFournie) {
            $resultats = $resultats->sortBy(fn (array $resultat) => $resultat['distanceKm'] ?? PHP_FLOAT_MAX);
        }

        return $resultats->values()->all();
    }

    private function parserEquipements(?string $brut): Collection
    {
        if (! $brut) {
            return collect();
        }

        return collect(explode(',', $brut))->filter()->values();
    }

    /**
     * Formule de Haversine plutôt qu'une requête PostGIS (`ST_Distance`) : la table `terrains` ne
     * stocke que des `latitude`/`longitude` en `float` (aucune colonne géométrique PostGIS n'a été
     * ajoutée — voir la migration), et les tests tournent sur SQLite en mémoire, qui n'a aucune
     * extension spatiale. Un calcul portable en PHP est donc le choix le plus honnête ici,
     * documenté comme un écart par rapport à "PostGIS" (architecture.md section 4) plutôt qu'une
     * vraie requête spatiale qu'on ne pourrait pas vérifier par un test réel dans cet environnement.
     */
    private function distanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $rayonTerreKm = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $rayonTerreKm * $c;
    }
}
