<?php

namespace App\Actions\Annonces;

use App\Contracts\GeocodingService;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

/**
 * US-06 — Modification d'une annonce déjà publiée. Seul le propriétaire de l'annonce peut la
 * modifier : pas une règle explicitement redites par RF-006, mais une frontière d'autorisation de
 * base (comme US-22 : seul l'auteur d'une réservation peut l'annuler) — pas une décision métier
 * incertaine à signaler, juste "on ne modifie pas l'annonce d'un autre".
 *
 * RF-021 (correction du 9 septembre 2026) : `paliers` est toujours envoyé au complet par le
 * frontend (même principe que `equipements`) — remplace l'ensemble existant plutôt que de le
 * fusionner. `fraisAnnulationPourcentage` distingue trois états (voir plus bas) : absent du
 * payload (le propriétaire n'y touche pas), explicitement `null` (il redemande le taux par
 * défaut), ou une valeur numérique (il fixe la sienne) — un simple `?? null` confondrait à tort
 * "absent" et "explicitement null", ce qui redéclencherait un recalcul + une notification à
 * chaque sauvegarde de l'annonce même quand le propriétaire ne touche pas à ce champ.
 */
class ModifierAnnonce
{
    public function __construct(
        private readonly GeocodingService $geocodingService,
        private readonly AttribuerFraisAnnulationDefaut $fraisAnnulationDefaut,
    ) {}

    /**
     * @param  array{sport: string, adresse: string, type: ?string, equipements: ?array<int, string>, paliers: array<int, array{delaiMinutes: int, pourcentageRemboursement: float}>, fraisAnnulationPourcentage?: ?float}  $payload
     */
    public function handle(Terrain $terrain, User $utilisateur, array $payload): Terrain
    {
        if ($terrain->proprietaire_id !== $utilisateur->id) {
            throw new AuthorizationException("Cette annonce ne t'appartient pas.");
        }

        // Re-géocoder uniquement si l'adresse change réellement : éviter un appel réseau inutile
        // (et son risque d'échec) quand seul le sport ou les équipements sont modifiés.
        $coordonnees = $payload['adresse'] !== $terrain->adresse
            ? $this->geocodingService->geocoder($payload['adresse'])
            : ['latitude' => $terrain->latitude, 'longitude' => $terrain->longitude];

        return DB::transaction(function () use ($terrain, $payload, $coordonnees) {
            $terrain->update([
                'sport' => $payload['sport'],
                'adresse' => $payload['adresse'],
                'latitude' => $coordonnees['latitude'],
                'longitude' => $coordonnees['longitude'],
                'type' => $payload['type'] ?? null,
                'equipements' => $payload['equipements'] ?? [],
            ]);

            if (array_key_exists('fraisAnnulationPourcentage', $payload)) {
                if ($payload['fraisAnnulationPourcentage'] !== null) {
                    // Taux explicite : le propriétaire vient de le choisir, pas besoin de l'en avertir.
                    $terrain->update(['frais_annulation_pourcentage' => $payload['fraisAnnulationPourcentage']]);
                } else {
                    // Reset explicite vers le taux par défaut : nouvelle attribution, donc nouvel
                    // avertissement, recalculé sur le nombre de terrains ACTUEL du propriétaire.
                    $nombreTerrains = Terrain::where('proprietaire_id', $terrain->proprietaire_id)->count();
                    $pourcentage = $this->fraisAnnulationDefaut->calculer($nombreTerrains);
                    $terrain->update(['frais_annulation_pourcentage' => $pourcentage]);
                    $this->fraisAnnulationDefaut->notifier($terrain, $pourcentage);
                }
            }
            // Champ absent du payload : aucune intention de le changer, on ne touche à rien —
            // sans quoi chaque sauvegarde de l'annonce redéclencherait un avertissement inutile.

            $terrain->paliers()->delete();
            foreach ($payload['paliers'] as $palier) {
                $terrain->paliers()->create([
                    'delai_minutes' => $palier['delaiMinutes'],
                    'pourcentage_remboursement' => $palier['pourcentageRemboursement'],
                ]);
            }

            return $terrain->load('paliers');
        });
    }
}
