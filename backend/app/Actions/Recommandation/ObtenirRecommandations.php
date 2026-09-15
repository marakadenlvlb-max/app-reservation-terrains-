<?php

namespace App\Actions\Recommandation;

use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;

/**
 * RF-024 (US-25, Could have) — suggestion de terrains basée sur l'historique du joueur.
 *
 * TODO métier : le SRS ne décrit aucun algorithme de recommandation précis ("basées sur mon
 * historique" dans le texte de la user story, sans détail) — ni scoring par popularité, ni
 * filtrage collaboratif, ni signal de géolocalisation (`fetchRecommandations` n'envoie d'ailleurs
 * aucune position). L'heuristique ci-dessous est une implémentation PROVISOIRE et clairement
 * signalée comme telle, pas une règle métier tranchée par le projet : elle recommande des
 * terrains dont le sport correspond à ce que le joueur a déjà pratiqué (déduit à la fois de
 * `UTILISATEUR.sports_pratiques` ET de ses réservations passées — les deux sources citées dans le
 * commentaire de `TerrainRecommande`, types.ts), en excluant les terrains déjà réservés par ce
 * joueur ("découvrir des terrains", pas re-suggérer ce qu'il connaît déjà) et en ne retenant que
 * les terrains ayant au moins un créneau réellement disponible à venir (recommander un terrain
 * sans rien à réserver n'aurait aucune valeur). Une vraie décision produit (scoring par
 * popularité, tests A/B, apprentissage sur les clics...) reste à définir si ce Could have est un
 * jour priorisé plus fortement.
 */
class ObtenirRecommandations
{
    /** Cap technique arbitraire (pas une règle métier) pour éviter une réponse démesurée. */
    private const LIMITE = 10;

    public function handle(User $joueur): array
    {
        $sportsInteresse = $this->sportsInteresse($joueur);

        if ($sportsInteresse->isEmpty()) {
            // Aucun signal exploitable (ni sport déclaré, ni historique) : pas de recommandation
            // plutôt qu'une suggestion large devinée à la place du joueur.
            return [];
        }

        $terrainsDejaReserves = Reservation::where('joueur_id', $joueur->id)
            ->with('creneau')
            ->get()
            ->pluck('creneau.terrain_id')
            ->filter()
            ->unique();

        $terrains = Terrain::query()
            ->whereIn('sport', $sportsInteresse)
            ->whereNotIn('id', $terrainsDejaReserves)
            ->with(['creneaux' => fn ($q) => $q->where('statut', 'disponible')->where('debut', '>', now())->orderBy('debut')])
            ->get()
            ->filter(fn (Terrain $terrain) => $terrain->creneaux->isNotEmpty())
            // Terrain dont le prochain créneau disponible arrive le plus tôt en premier — même
            // choix d'ordre par défaut, faute de signal de pertinence, que RechercherTerrains.
            ->sortBy(fn (Terrain $terrain) => $terrain->creneaux->first()->debut)
            ->take(self::LIMITE);

        return $terrains->map(fn (Terrain $terrain) => [
            'terrainId' => $terrain->id,
            'sport' => $terrain->sport,
            'adresse' => $terrain->adresse,
            'type' => $terrain->type,
            'photoPrincipale' => $terrain->photos[0] ?? null,
            'equipements' => $terrain->equipements,
            'tarifMin' => (float) $terrain->creneaux->min('tarif'),
        ])->values()->all();
    }

    /**
     * Union des sports déclarés au profil et des sports réellement pratiqués via l'historique de
     * réservations — un joueur qui a réservé du tennis sans l'avoir déclaré à l'inscription (ou
     * l'inverse) doit voir les deux signaux pris en compte.
     */
    private function sportsInteresse(User $joueur): \Illuminate\Support\Collection
    {
        $sportsDeclares = collect($joueur->sports_pratiques ?? []);

        $sportsReserves = Reservation::where('joueur_id', $joueur->id)
            ->with('creneau.terrain')
            ->get()
            ->pluck('creneau.terrain.sport')
            ->filter();

        return $sportsDeclares->merge($sportsReserves)->unique()->values();
    }
}
