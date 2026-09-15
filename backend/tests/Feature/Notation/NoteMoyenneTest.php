<?php

use App\Models\Notation;
use App\Models\User;
use Illuminate\Support\Str;

// TC-017-01 : contrat exact de fetchNoteMoyenne (notationApi.ts) — endpoint public.
test('affiche la note moyenne et le nombre d\'avis, sans authentification', function () {
    $utilisateur = User::factory()->create();
    Notation::factory()->create(['cible_id' => $utilisateur->id, 'note' => 5]);
    Notation::factory()->create(['cible_id' => $utilisateur->id, 'note' => 4]);

    $reponse = $this->getJson("/api/utilisateurs/{$utilisateur->id}/note");

    $reponse->assertOk()->assertJson([
        'utilisateurId' => $utilisateur->id,
        'moyenne' => 4.5,
        'nombreAvis' => 2,
    ]);
});

// TC-017-02 : moyenne null (pas 0) quand l'utilisateur n'a encore aucun avis — distingue une
// vraie moyenne basse d'une absence d'avis (types.ts).
test('affiche moyenne null et 0 avis quand l\'utilisateur n\'a encore aucun avis', function () {
    $utilisateur = User::factory()->create();

    $this->getJson("/api/utilisateurs/{$utilisateur->id}/note")
        ->assertOk()
        ->assertJson(['utilisateurId' => $utilisateur->id, 'moyenne' => null, 'nombreAvis' => 0]);
});

test('arrondit la moyenne à une décimale', function () {
    $utilisateur = User::factory()->create();
    Notation::factory()->create(['cible_id' => $utilisateur->id, 'note' => 5]);
    Notation::factory()->create(['cible_id' => $utilisateur->id, 'note' => 5]);
    Notation::factory()->create(['cible_id' => $utilisateur->id, 'note' => 4]);

    // (5 + 5 + 4) / 3 = 4.666... → 4.7
    $this->getJson("/api/utilisateurs/{$utilisateur->id}/note")
        ->assertOk()
        ->assertJson(['moyenne' => 4.7]);
});

test('ne compte que les avis reçus par cet utilisateur, pas ceux qu\'il a donnés', function () {
    $utilisateur = User::factory()->create();
    $autre = User::factory()->create();
    Notation::factory()->create(['auteur_id' => $utilisateur->id, 'cible_id' => $autre->id, 'note' => 1]);

    $this->getJson("/api/utilisateurs/{$utilisateur->id}/note")
        ->assertOk()
        ->assertJson(['moyenne' => null, 'nombreAvis' => 0]);
});

test('refuse un utilisateur qui n\'existe pas', function () {
    $this->getJson('/api/utilisateurs/'.(string) Str::uuid().'/note')
        ->assertNotFound();
});
