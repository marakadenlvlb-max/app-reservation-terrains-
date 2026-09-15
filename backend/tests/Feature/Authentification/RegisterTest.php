<?php

use App\Models\User;

// TC-001-02 (rapport-qa.md) : le contrat exact attendu par registerApi.ts — 201, utilisateurId +
// identifiant, aucun token (l'inscription ne connecte pas automatiquement, voir
// InscrireUtilisateur).
test('inscrit un utilisateur avec des données valides', function () {
    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'motdepasse123',
        'sports' => ['foot', 'tennis'],
    ]);

    $reponse->assertCreated()
        ->assertJsonStructure(['utilisateurId', 'identifiant'])
        ->assertJsonMissingPath('token')
        ->assertJson(['identifiant' => 'awa@example.com']);

    $utilisateur = User::where('email_ou_telephone', 'awa@example.com')->first();
    expect($utilisateur)->not->toBeNull();
    expect($utilisateur->sports_pratiques)->toBe(['foot', 'tennis']);
    // Le hash ne doit jamais être le mot de passe en clair.
    expect($utilisateur->mot_de_passe_hash)->not->toBe('motdepasse123');
    // Chaque utilisateur reçoit un code de parrainage dès l'inscription (colonne NOT NULL unique).
    expect($utilisateur->code_parrainage)->not->toBeEmpty();
});

// TC-001-03 : téléphone accepté comme identifiant (RF-001 "email OU téléphone").
test('accepte un numéro de téléphone comme identifiant', function () {
    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => '+221771234567',
        'motDePasse' => 'motdepasse123',
        'sports' => ['basket'],
    ]);

    $reponse->assertCreated();
});

// TC-001-04 : identifiant au mauvais format — message exact attendu par registerApi.ts
// (body?.message affiché tel quel).
test('refuse un identifiant qui n\'est ni un email ni un téléphone valide', function () {
    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => 'pasuncontact',
        'motDePasse' => 'motdepasse123',
        'sports' => ['foot'],
    ]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Format invalide : saisis un email ou un numéro de téléphone valide.']);
});

// TC-001-05 : mot de passe trop court.
test('refuse un mot de passe de moins de 8 caractères', function () {
    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'abc123',
        'sports' => ['foot'],
    ]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Le mot de passe doit contenir au moins 8 caractères.']);
});

test('refuse une inscription sans aucun sport sélectionné', function () {
    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'motdepasse123',
        'sports' => [],
    ]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Sélectionne au moins un sport pratiqué.']);
});

// TC-001-06 (rapport-qa.md) : le message renvoyé par le backend doit s'afficher tel quel côté
// frontend — c'est exactement ce que vérifie cette assertion.
test('refuse un identifiant déjà utilisé', function () {
    User::factory()->create(['email_ou_telephone' => 'awa@example.com']);

    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'motdepasse123',
        'sports' => ['foot'],
    ]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Cet email ou ce numéro est déjà utilisé.']);
});

// RNF-002 : limitation des tentatives — la 7e requête en moins d'une minute doit être bloquée.
test('limite le nombre de tentatives d\'inscription (RNF-002, anti force brute)', function () {
    for ($i = 0; $i < 6; $i++) {
        $this->postJson('/api/auth/register', [
            'identifiant' => "user{$i}@example.com",
            'motDePasse' => 'motdepasse123',
            'sports' => ['foot'],
        ]);
    }

    $reponse = $this->postJson('/api/auth/register', [
        'identifiant' => 'user7@example.com',
        'motDePasse' => 'motdepasse123',
        'sports' => ['foot'],
    ]);

    $reponse->assertStatus(429);
});
