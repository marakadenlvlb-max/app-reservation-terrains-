<?php

namespace App\Actions\Authentification;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * RF-002 — Vérifie le couple identifiant/mot de passe. Ne s'occupe que de la logique métier
 * (le compte existe-t-il, le mot de passe correspond-il ?) — créer la session/le jeton relève du
 * contrôleur (AuthController), qui touche au cycle requête/réponse plutôt qu'à une règle métier.
 */
class ConnecterUtilisateur
{
    public function handle(string $identifiant, string $motDePasse): ?User
    {
        $utilisateur = User::where('email_ou_telephone', $identifiant)->first();

        if (! $utilisateur || ! Hash::check($motDePasse, $utilisateur->mot_de_passe_hash)) {
            return null;
        }

        return $utilisateur;
    }
}
