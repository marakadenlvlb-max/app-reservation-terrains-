<?php

use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// US-27 : contrat exact de fetchMesTerrains (terrainApi.ts) — même forme que TerrainResource déjà
// vérifiée ailleurs (TerrainTest.php), seul le filtrage par propriétaire est spécifique ici.
test('liste les annonces du propriétaire connecté', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create([
        'proprietaire_id' => $proprietaire->id,
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
    ]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->getJson('/api/terrains/mes-terrains');

    $reponse->assertOk()->assertJsonCount(1)->assertJson([[
        'id' => $terrain->id,
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
    ]]);
});

test('n\'affiche pas les annonces d\'un autre propriétaire', function () {
    Terrain::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/terrains/mes-terrains')->assertOk()->assertJsonCount(0);
});

test('trie les annonces du plus récent au plus ancien', function () {
    $proprietaire = User::factory()->create();
    $ancienne = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'created_at' => now()->subDays(2)]);
    $recente = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'created_at' => now()]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->getJson('/api/terrains/mes-terrains')->assertOk();

    expect($reponse->json('0.id'))->toBe($recente->id);
    expect($reponse->json('1.id'))->toBe($ancienne->id);
});

test('affiche un tableau vide plutôt qu\'une erreur quand il n\'y a encore aucune annonce', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/terrains/mes-terrains')->assertOk()->assertExactJson([]);
});

test('refuse de consulter mes-terrains sans authentification', function () {
    $this->getJson('/api/terrains/mes-terrains')->assertUnauthorized();
});

// TC : `mes-terrains` doit rester distincte de `{terrain}` (piège d'ordre de route, voir
// routes/api.php) — un id de terrain qui commence par une chaîne proche ne doit jamais matcher
// la route littérale à sa place. Vérifié indirectement : la route `{terrain}` avec un id
// inexistant renvoie 404, pas le comportement de `mes-terrains`.
test('un id de terrain inconnu continue de renvoyer 404 sur la route à paramètre', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/terrains/un-id-qui-nexiste-pas')->assertNotFound();
});
