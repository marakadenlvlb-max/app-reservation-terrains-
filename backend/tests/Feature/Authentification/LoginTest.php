<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// TC-002-02 : contrat exact de loginApi.ts — utilisateurId, identifiant, ET un token (mobile).
test('connecte un utilisateur avec des identifiants valides et renvoie un token', function () {
    User::factory()->create([
        'email_ou_telephone' => 'awa@example.com',
        'mot_de_passe_hash' => Hash::make('motdepasse123'),
    ]);

    $reponse = $this->postJson('/api/auth/login', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'motdepasse123',
    ]);

    $reponse->assertOk()
        ->assertJsonStructure(['utilisateurId', 'identifiant', 'token']);
});

// Guard hybride (architecture.md, BUG-001) : une connexion réussie doit AUSSI ouvrir une session
// web, matérialisée par le cookie de session Laravel dans la réponse — pas seulement le token
// JSON consommé par le mobile. Le Referer doit correspondre à SANCTUM_STATEFUL_DOMAINS (.env) :
// sans lui, Sanctum ne traite pas la requête comme "stateful" et aucune session n'est démarrée
// (EnsureFrontendRequestsAreStateful::fromFrontend(), découvert en testant réellement).
test('ouvre une session web (cookie) en plus du token, à la connexion', function () {
    User::factory()->create([
        'email_ou_telephone' => 'awa@example.com',
        'mot_de_passe_hash' => Hash::make('motdepasse123'),
    ]);

    $reponse = $this->withHeader('Referer', 'http://localhost:3000')->postJson('/api/auth/login', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'motdepasse123',
    ]);

    $reponse->assertOk();
    $this->assertAuthenticated('web');
});

// TC-002-03 : message générique, RNF-002 anti-énumération — jamais préciser lequel des deux
// champs est incorrect.
test('refuse une connexion avec un mot de passe incorrect, message générique', function () {
    User::factory()->create([
        'email_ou_telephone' => 'awa@example.com',
        'mot_de_passe_hash' => Hash::make('motdepasse123'),
    ]);

    $reponse = $this->postJson('/api/auth/login', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'mauvais-mot-de-passe',
    ]);

    $reponse->assertStatus(401)
        ->assertJson(['message' => 'Identifiant ou mot de passe incorrect.']);
    $this->assertGuest('web');
});

test('refuse une connexion pour un identifiant qui n\'existe pas, même message générique', function () {
    $reponse = $this->postJson('/api/auth/login', [
        'identifiant' => 'inconnu@example.com',
        'motDePasse' => 'motdepasse123',
    ]);

    $reponse->assertStatus(401)
        ->assertJson(['message' => 'Identifiant ou mot de passe incorrect.']);
});

test('limite le nombre de tentatives de connexion (RNF-002, anti force brute)', function () {
    User::factory()->create(['email_ou_telephone' => 'awa@example.com']);

    for ($i = 0; $i < 6; $i++) {
        $this->postJson('/api/auth/login', [
            'identifiant' => 'awa@example.com',
            'motDePasse' => 'mauvais-mot-de-passe',
        ]);
    }

    $reponse = $this->postJson('/api/auth/login', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'mauvais-mot-de-passe',
    ]);

    $reponse->assertStatus(429);
});
