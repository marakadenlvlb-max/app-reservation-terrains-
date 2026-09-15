<?php

namespace App\Actions\Annonces;

use App\Contracts\GeocodingService;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * RF-004/RF-005 — Publication d'une annonce. Le géocodage de `adresse` est fait ici (pas dans le
 * contrôleur) : c'est une conséquence directe de la création, pas un détail de cycle
 * requête/réponse.
 *
 * RF-021 (correction du 9 septembre 2026) : publier un terrain exige désormais au moins un palier
 * d'annulation dans la même requête (validé par TerrainRequest, pas ici) et attribue son taux de
 * frais de transaction — explicite si fourni, sinon calculé selon le barème dégressif et notifié
 * au propriétaire (AttribuerFraisAnnulationDefaut).
 */
class PublierAnnonce
{
    public function __construct(
        private readonly GeocodingService $geocodingService,
        private readonly AttribuerFraisAnnulationDefaut $fraisAnnulationDefaut,
    ) {}

    /**
     * @param  array{sport: string, adresse: string, type: ?string, equipements: ?array<int, string>, paliers: array<int, array{delaiMinutes: int, pourcentageRemboursement: float}>, fraisAnnulationPourcentage: ?float}  $payload
     */
    public function handle(User $proprietaire, array $payload): Terrain
    {
        $coordonnees = $this->geocodingService->geocoder($payload['adresse']);

        return DB::transaction(function () use ($proprietaire, $payload, $coordonnees) {
            $fraisExplicite = $payload['fraisAnnulationPourcentage'] ?? null;

            $terrain = Terrain::create([
                'proprietaire_id' => $proprietaire->id,
                'sport' => $payload['sport'],
                'adresse' => $payload['adresse'],
                'latitude' => $coordonnees['latitude'],
                'longitude' => $coordonnees['longitude'],
                'type' => $payload['type'] ?? null,
                'equipements' => $payload['equipements'] ?? [],
                // Valeur temporaire tant qu'on ne connaît pas encore le nombre total de terrains
                // du propriétaire (voir juste en dessous) — ajustée avant tout retour au frontend.
                'frais_annulation_pourcentage' => $fraisExplicite ?? 0,
            ]);

            if ($fraisExplicite === null) {
                // Le nombre de terrains DOIT inclure celui qu'on vient de créer (le barème réagit
                // au nombre total détenu, pas seulement aux précédents).
                $nombreTerrains = Terrain::where('proprietaire_id', $proprietaire->id)->count();
                $pourcentage = $this->fraisAnnulationDefaut->calculer($nombreTerrains);
                $terrain->update(['frais_annulation_pourcentage' => $pourcentage]);
                $this->fraisAnnulationDefaut->notifier($terrain, $pourcentage);
            }

            foreach ($payload['paliers'] as $palier) {
                $terrain->paliers()->create([
                    'delai_minutes' => $palier['delaiMinutes'],
                    'pourcentage_remboursement' => $palier['pourcentageRemboursement'],
                ]);
            }

            // load() plutôt que fresh() : fresh() renvoie une NOUVELLE instance hydratée par une
            // requête SELECT, qui perd le flag `wasRecentlyCreated` — Laravel s'en sert pour
            // choisir 201 plutôt que 200 en réponse (ResourceResponse::calculateStatus()), un
            // écart de contrat qu'un test a immédiatement révélé (201 attendu, 200 reçu).
            return $terrain->load('paliers');
        });
    }
}
