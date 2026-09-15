<?php

namespace App\Actions\Authentification;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * RF-001 — Création du compte. Ne connecte pas automatiquement l'utilisateur (pas de token
 * renvoyé) : registerApi.ts / RegisterResult ne portent qu'utilisateurId + identifiant, la
 * connexion est un parcours séparé (RF-002) — voir useRegisterForm.ts, `onSuccess` ne reçoit que
 * l'id, jamais un token à stocker.
 */
class InscrireUtilisateur
{
    /**
     * @param  array{identifiant: string, motDePasse: string, sports: array<int, string>}  $payload
     */
    public function handle(array $payload): User
    {
        return User::create([
            'email_ou_telephone' => $payload['identifiant'],
            'mot_de_passe_hash' => Hash::make($payload['motDePasse']),
            'sports_pratiques' => $payload['sports'],
            'code_parrainage' => $this->genererCodeParrainageUnique(),
        ]);
    }

    /**
     * RF-025 (Could have, pas encore implémenté) ne précise ni le format ni l'algorithme de
     * génération du code de parrainage — signalé comme trou de décision métier dans la session QA
     * (rapport-qa.md, US-26) et rappelé dans le skill dev-laravel. Un code doit néanmoins exister
     * dès l'inscription (colonne NOT NULL unique, architecture.md) : ce générateur est un choix
     * technique par défaut (8 caractères alphanumériques), pas une règle métier tranchée — à
     * revoir explicitement le jour où US-26 est réellement implémentée côté backend.
     */
    private function genererCodeParrainageUnique(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (User::where('code_parrainage', $code)->exists());

        return $code;
    }
}
