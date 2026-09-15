<?php

namespace App\Actions\Authentification;

use App\Models\User;

/**
 * RF-003 — Édition des champs texte du profil (nom, ville, sports). Séparée de l'upload de photo
 * (TeleverserPhotoProfil) — même découpage que côté frontend (updateProfile vs
 * uploadProfilePhoto, deux endpoints distincts dans profileApi.ts).
 */
class MettreAJourProfil
{
    /**
     * @param  array{nom: string, ville: ?string, sports: array<int, string>}  $payload
     */
    public function handle(User $utilisateur, array $payload): User
    {
        $utilisateur->update([
            'nom' => $payload['nom'],
            'ville' => $payload['ville'] ?? null,
            'sports_pratiques' => $payload['sports'],
        ]);

        return $utilisateur;
    }
}
