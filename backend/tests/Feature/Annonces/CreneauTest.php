<?php

use App\Models\Creneau;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// TC-005-01 : contrat exact de createCreneau (creneauApi.ts) — terrainId vient de la route, pas
// du corps de la requête.
test('ajoute un créneau à son propre terrain', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson("/api/terrains/{$terrain->id}/creneaux", [
        'debut' => '2026-09-01T18:00',
        'fin' => '2026-09-01T19:00',
        'tarif' => 15000,
    ]);

    $reponse->assertCreated()->assertJson([
        'terrainId' => $terrain->id,
        'tarif' => 15000,
        'statut' => 'disponible',
    ]);
});

test('refuse d\'ajouter un créneau au terrain d\'un autre utilisateur', function () {
    $terrain = Terrain::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->postJson("/api/terrains/{$terrain->id}/creneaux", [
        'debut' => '2026-09-01T18:00',
        'fin' => '2026-09-01T19:00',
        'tarif' => 15000,
    ])->assertForbidden();
});

// TC-005-02 : validation — mêmes messages que validateCreateCreneauPayload (validation.ts).
test('refuse un créneau dont la fin précède le début', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson("/api/terrains/{$terrain->id}/creneaux", [
        'debut' => '2026-09-01T19:00',
        'fin' => '2026-09-01T18:00',
        'tarif' => 15000,
    ]);

    $reponse->assertStatus(422)->assertJson(['message' => 'La fin doit être après le début.']);
});

test('refuse un tarif négatif ou nul', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson("/api/terrains/{$terrain->id}/creneaux", [
        'debut' => '2026-09-01T18:00',
        'fin' => '2026-09-01T19:00',
        'tarif' => 0,
    ]);

    $reponse->assertStatus(422)->assertJson(['message' => 'Le tarif doit être un nombre positif.']);
});

test('refuse un format de date différent de AAAA-MM-JJTHH:MM', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson("/api/terrains/{$terrain->id}/creneaux", [
        'debut' => '2026-09-01 18:00:00',
        'fin' => '2026-09-01T19:00',
        'tarif' => 15000,
    ]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Date et heure de début requises (format AAAA-MM-JJTHH:MM).']);
});

// TC-005-03 : liste des créneaux d'un terrain.
test('liste les créneaux de son propre terrain', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Creneau::factory()->count(2)->create(['terrain_id' => $terrain->id]);
    Sanctum::actingAs($proprietaire);

    $this->getJson("/api/terrains/{$terrain->id}/creneaux")->assertOk()->assertJsonCount(2);
});

test('refuse de lister les créneaux du terrain d\'un autre utilisateur', function () {
    $terrain = Terrain::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/terrains/{$terrain->id}/creneaux")->assertForbidden();
});

// TC-006-04 : modification d'un créneau — route top-level /api/creneaux/{id}, sans terrainId.
test('modifie un créneau de son propre terrain', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'tarif' => 10000]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->patchJson("/api/creneaux/{$creneau->id}", [
        'debut' => '2026-09-02T18:00',
        'fin' => '2026-09-02T19:00',
        'tarif' => 20000,
    ]);

    $reponse->assertOk()->assertJson(['tarif' => 20000]);
});

// Règle actée dans backlog.md (US-06) : un créneau déjà réservé ne peut plus être modifié —
// vérifiée côté client mais jamais encore appliquée côté backend avant cette tâche.
test('refuse de modifier un créneau déjà réservé', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'reserve']);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->patchJson("/api/creneaux/{$creneau->id}", [
        'debut' => '2026-09-02T18:00',
        'fin' => '2026-09-02T19:00',
        'tarif' => 20000,
    ]);

    $reponse->assertStatus(409)
        ->assertJson(['message' => 'Ce créneau est déjà réservé et ne peut plus être modifié.']);
});

test('refuse de modifier un créneau du terrain d\'un autre utilisateur', function () {
    $creneau = Creneau::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson("/api/creneaux/{$creneau->id}", [
        'debut' => '2026-09-02T18:00',
        'fin' => '2026-09-02T19:00',
        'tarif' => 20000,
    ])->assertForbidden();
});

// TC-006-05 : retrait d'un créneau.
test('retire un créneau de son propre terrain', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id]);
    Sanctum::actingAs($proprietaire);

    $this->deleteJson("/api/creneaux/{$creneau->id}")->assertNoContent();

    expect(Creneau::find($creneau->id))->toBeNull();
});

test('refuse de retirer un créneau déjà réservé', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'reserve']);
    Sanctum::actingAs($proprietaire);

    $this->deleteJson("/api/creneaux/{$creneau->id}")
        ->assertStatus(409)
        ->assertJson(['message' => 'Ce créneau est déjà réservé et ne peut plus être retiré.']);
    expect(Creneau::find($creneau->id))->not->toBeNull();
});

test('refuse de retirer un créneau du terrain d\'un autre utilisateur', function () {
    $creneau = Creneau::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->deleteJson("/api/creneaux/{$creneau->id}")->assertForbidden();
    expect(Creneau::find($creneau->id))->not->toBeNull();
});
