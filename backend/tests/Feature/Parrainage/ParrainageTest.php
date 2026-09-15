<?php

use App\Models\Parrainage;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// TC-026-02 : contrat exact de fetchParrainageResume (parrainageApi.ts) — code déjà généré à
// l'inscription (InscrireUtilisateur).
test('affiche le code de parrainage et la liste des filleuls', function () {
    $parrain = User::factory()->create(['code_parrainage' => 'ABC12345']);
    $filleul = User::factory()->create(['nom' => 'Awa Diop']);
    Parrainage::factory()->create([
        'parrain_id' => $parrain->id,
        'filleul_id' => $filleul->id,
        'statut' => 'utilise',
        'avantage' => '10% de réduction sur ta prochaine réservation.',
    ]);
    Sanctum::actingAs($parrain);

    $reponse = $this->getJson('/api/parrainage');

    $reponse->assertOk()->assertJson([
        'codeParrainage' => 'ABC12345',
        'filleuls' => [[
            'id' => $filleul->id,
            'nom' => 'Awa Diop',
            'statut' => 'utilise',
            'avantage' => '10% de réduction sur ta prochaine réservation.',
        ]],
    ]);
});

test('affiche un résumé vide sans filleul', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/parrainage')->assertOk()->assertJson(['filleuls' => []]);
});

test('refuse de consulter le parrainage sans authentification', function () {
    $this->getJson('/api/parrainage')->assertUnauthorized();
});

// TC-026-03 : activation immédiate dès l'usage du code (décision explicite, pas d'état 'en_attente').
test('utilise un code de parrainage et active immédiatement l\'avantage du parrain', function () {
    $parrain = User::factory()->create(['code_parrainage' => 'ABC12345']);
    $filleul = User::factory()->create();
    Sanctum::actingAs($filleul);

    $this->postJson('/api/parrainage/utiliser', ['code' => 'abc12345'])->assertNoContent();

    $parrainage = Parrainage::where('parrain_id', $parrain->id)->where('filleul_id', $filleul->id)->first();
    expect($parrainage)->not->toBeNull();
    expect($parrainage->statut)->toBe('valide');
    expect((float) $parrainage->reduction_pourcentage)->toBe(10.0);
});

test('refuse un code de parrainage inexistant', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/parrainage/utiliser', ['code' => 'INCONNU'])
        ->assertStatus(422)
        ->assertJson(['message' => 'Ce code de parrainage est invalide.']);
});

test('refuse d\'utiliser son propre code', function () {
    $utilisateur = User::factory()->create(['code_parrainage' => 'ABC12345']);
    Sanctum::actingAs($utilisateur);

    $this->postJson('/api/parrainage/utiliser', ['code' => 'ABC12345'])
        ->assertStatus(422)
        ->assertJson(['message' => 'Tu ne peux pas utiliser ton propre code de parrainage.']);
});

// UTILISATEUR ||--o| PARRAINAGE : un filleul n'a qu'un seul parrain possible.
test('refuse d\'utiliser un second code de parrainage', function () {
    $filleul = User::factory()->create();
    Parrainage::factory()->create(['filleul_id' => $filleul->id]);
    $autreParrain = User::factory()->create(['code_parrainage' => 'XYZ98765']);
    Sanctum::actingAs($filleul);

    $this->postJson('/api/parrainage/utiliser', ['code' => 'XYZ98765'])
        ->assertStatus(409)
        ->assertJson(['message' => 'Tu as déjà utilisé un code de parrainage.']);
});

test('refuse un code vide', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/parrainage/utiliser', ['code' => ''])
        ->assertStatus(422)
        ->assertJson(['message' => 'Saisis un code de parrainage.']);
});

test('refuse d\'utiliser un code sans authentification', function () {
    $this->postJson('/api/parrainage/utiliser', ['code' => 'ABC12345'])->assertUnauthorized();
});
