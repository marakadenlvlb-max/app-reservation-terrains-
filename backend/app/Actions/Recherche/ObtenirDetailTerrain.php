<?php

namespace App\Actions\Recherche;

use App\Actions\Notation\ObtenirNoteMoyenne;
use App\Models\Terrain;

/**
 * RF-009 (US-08) — détail complet d'une annonce avant réservation : photos, tarif, créneaux
 * encore disponibles, note moyenne du propriétaire/gestionnaire (RF-016/RF-017, réutilise
 * ObtenirNoteMoyenne plutôt que de dupliquer l'agrégat).
 */
class ObtenirDetailTerrain
{
    public function __construct(private readonly ObtenirNoteMoyenne $noteMoyenne) {}

    public function handle(Terrain $terrain): array
    {
        $creneaux = $terrain->creneaux()
            ->where('statut', 'disponible')
            ->where('debut', '>', now())
            ->orderBy('debut')
            ->get();

        $note = $this->noteMoyenne->handle($terrain->proprietaire);

        return [
            'id' => $terrain->id,
            'sport' => $terrain->sport,
            'adresse' => $terrain->adresse,
            'type' => $terrain->type,
            'equipements' => $terrain->equipements,
            'photos' => $terrain->photos,
            'proprietaireNoteMoyenne' => $note['moyenne'],
            'creneauxDisponibles' => $creneaux->map(fn ($creneau) => [
                'id' => $creneau->id,
                'debut' => $creneau->debut->toIso8601String(),
                'fin' => $creneau->fin->toIso8601String(),
                'tarif' => (float) $creneau->tarif,
            ])->values(),
        ];
    }
}
