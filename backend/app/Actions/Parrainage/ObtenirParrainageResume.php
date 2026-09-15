<?php

namespace App\Actions\Parrainage;

use App\Models\Parrainage;
use App\Models\User;

/**
 * RF-025 — vue combinée attendue par fetchParrainageResume (parrainageApi.ts) : le code à
 * partager (déjà généré à l'inscription, voir InscrireUtilisateur) et la liste des filleuls déjà
 * parrainés, du point de vue du parrain.
 */
class ObtenirParrainageResume
{
    public function handle(User $utilisateur): array
    {
        $filleuls = Parrainage::where('parrain_id', $utilisateur->id)
            ->with('filleul')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Parrainage $parrainage) => [
                'id' => $parrainage->filleul->id,
                'nom' => $parrainage->filleul->nom,
                'statut' => $parrainage->statut,
                'avantage' => $parrainage->avantage,
                'createdAt' => $parrainage->created_at->toIso8601String(),
            ])
            ->values();

        return [
            'codeParrainage' => $utilisateur->code_parrainage,
            'filleuls' => $filleuls,
        ];
    }
}
