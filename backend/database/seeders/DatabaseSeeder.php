<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Stub par défaut de Laravel corrigé : il référençait encore les colonnes `name`/`email` du
     * scaffold standard, retirées de la table `users` au profit de `nom`/`email_ou_telephone`
     * (voir la migration create_users_table) — jamais exécuté jusqu'ici faute de serveur Postgres
     * local (voir le commentaire de backend/.env), donc jamais détecté avant ce lancement en
     * local. Deux comptes de démo (mot de passe connu) plutôt qu'un seul : le parcours complet
     * (publier une annonce puis la réserver/payer/noter) demande deux utilisateurs distincts.
     */
    public function run(): void
    {
        User::factory()->create([
            'nom' => 'Amadou Proprio',
            'email_ou_telephone' => 'proprio@example.com',
            'mot_de_passe_hash' => Hash::make('password'),
        ]);

        User::factory()->create([
            'nom' => 'Fatou Joueuse',
            'email_ou_telephone' => 'joueuse@example.com',
            'mot_de_passe_hash' => Hash::make('password'),
        ]);
    }
}
