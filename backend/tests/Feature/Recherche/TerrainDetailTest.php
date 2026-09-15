<?php

use App\Models\Creneau;
use App\Models\Notation;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;

// TC-008-01 : contrat exact de fetchTerrainDetail (rechercheApi.ts) — endpoint public.
test('affiche le détail d\'un terrain, sans authentification', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'equipements' => ['vestiaires'], 'photos' => ['url-1']]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson("/api/terrains/{$terrain->id}/detail");

    $reponse->assertOk()->assertJson([
        'id' => $terrain->id,
        'sport' => $terrain->sport,
        'adresse' => $terrain->adresse,
        'equipements' => ['vestiaires'],
        'photos' => ['url-1'],
        'proprietaireNoteMoyenne' => null,
    ]);
    $reponse->assertJsonFragment(['id' => $creneau->id]);
});

test('affiche la note moyenne du propriétaire quand des avis existent', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Notation::factory()->create(['cible_id' => $proprietaire->id, 'note' => 4]);
    Notation::factory()->create(['cible_id' => $proprietaire->id, 'note' => 5]);

    $this->getJson("/api/terrains/{$terrain->id}/detail")
        ->assertOk()->assertJson(['proprietaireNoteMoyenne' => 4.5]);
});

// RF-009 : seuls les créneaux ENCORE disponibles doivent apparaître dans le détail.
test('n\'inclut pas les créneaux déjà réservés ni déjà commencés', function () {
    $terrain = Terrain::factory()->create();
    $creneauDisponible = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'reserve', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->subHour(), 'fin' => now()->addMinutes(30)]);

    $reponse = $this->getJson("/api/terrains/{$terrain->id}/detail");

    $reponse->assertOk();
    expect($reponse->json('creneauxDisponibles'))->toHaveCount(1);
    expect($reponse->json('creneauxDisponibles.0.id'))->toBe($creneauDisponible->id);
});

test('404 si le terrain n\'existe pas', function () {
    $this->getJson('/api/terrains/'.\Illuminate\Support\Str::uuid().'/detail')->assertNotFound();
});
