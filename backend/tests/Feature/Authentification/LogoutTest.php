<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// TC-002-04 : déconnexion côté web — invalide la session (donc le cookie devient inutile). Le
// Referer doit matcher SANCTUM_STATEFUL_DOMAINS sur LES DEUX requêtes pour que chacune soit
// traitée comme "stateful" par Sanctum (voir la même note dans LoginTest).
test('déconnecte un utilisateur authentifié par session web', function () {
    User::factory()->create([
        'email_ou_telephone' => 'awa@example.com',
        'mot_de_passe_hash' => Hash::make('motdepasse123'),
    ]);

    $this->withHeader('Referer', 'http://localhost:3000')->postJson('/api/auth/login', [
        'identifiant' => 'awa@example.com',
        'motDePasse' => 'motdepasse123',
    ])->assertOk();
    $this->assertAuthenticated('web');

    $this->withHeader('Referer', 'http://localhost:3000')
        ->postJson('/api/auth/logout')
        ->assertNoContent();

    $this->assertGuest('web');
});

// Mobile : la déconnexion doit révoquer le jeton Bearer utilisé, pas seulement répondre 204.
test('déconnecte un utilisateur authentifié par jeton Bearer et révoque ce jeton', function () {
    $utilisateur = User::factory()->create();
    $token = $utilisateur->createToken('mobile')->plainTextToken;

    expect($utilisateur->tokens()->count())->toBe(1);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/logout')
        ->assertNoContent();

    expect($utilisateur->fresh()->tokens()->count())->toBe(0);
});

// TC-002-05 : symétrique côté frontend (useLogout.ts efface toujours la session locale même si
// l'appel échoue) — côté backend, on vérifie juste qu'une requête non authentifiée est rejetée
// proprement plutôt que de planter.
test('refuse la déconnexion sans authentification', function () {
    $this->postJson('/api/auth/logout')->assertUnauthorized();
});
