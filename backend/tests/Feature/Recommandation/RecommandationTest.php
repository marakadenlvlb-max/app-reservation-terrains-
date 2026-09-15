<?php

use App\Models\Creneau;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// TC-025-01 : contrat exact de fetchRecommandations (recommandationApi.ts) — exige un token.
test('refuse de consulter les recommandations sans authentification', function () {
    $this->getJson('/api/recommandations/terrains')->assertUnauthorized();
});

// RF-024 : sport déclaré au profil (UTILISATEUR.sports_pratiques).
test('recommande un terrain du même sport que celui déclaré au profil', function () {
    $joueur = User::factory()->create(['sports_pratiques' => ['tennis']]);
    $terrainTennis = Terrain::factory()->create(['sport' => 'tennis']);
    $terrainFoot = Terrain::factory()->create(['sport' => 'foot']);
    Creneau::factory()->create(['terrain_id' => $terrainTennis->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrainFoot->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson('/api/recommandations/terrains');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['terrainId' => $terrainTennis->id]);
});

// RF-024 : sport déduit de l'historique de réservations, même sans déclaration au profil.
test('recommande un terrain du même sport qu\'une réservation passée', function () {
    $joueur = User::factory()->create(['sports_pratiques' => []]);
    $terrainDejaJoue = Terrain::factory()->create(['sport' => 'basket']);
    $creneauDejaReserve = Creneau::factory()->create(['terrain_id' => $terrainDejaJoue->id]);
    Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneauDejaReserve->id]);

    $terrainRecommandable = Terrain::factory()->create(['sport' => 'basket']);
    Creneau::factory()->create(['terrain_id' => $terrainRecommandable->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson('/api/recommandations/terrains');

    $reponse->assertOk()->assertJsonFragment(['terrainId' => $terrainRecommandable->id]);
});

// "Découvrir des terrains" : ne pas re-suggérer un terrain déjà réservé par ce joueur.
test('n\'inclut pas un terrain déjà réservé par ce joueur', function () {
    $joueur = User::factory()->create(['sports_pratiques' => ['foot']]);
    $terrainDejaReserve = Terrain::factory()->create(['sport' => 'foot']);
    $creneauReserve = Creneau::factory()->create(['terrain_id' => $terrainDejaReserve->id]);
    Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneauReserve->id]);
    // Ce même terrain a par ailleurs un créneau encore disponible — il ne doit quand même pas apparaître.
    Creneau::factory()->create(['terrain_id' => $terrainDejaReserve->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Sanctum::actingAs($joueur);

    $this->getJson('/api/recommandations/terrains')->assertOk()->assertJsonCount(0);
});

// Un terrain sans aucun créneau réellement disponible n'a aucune valeur à recommander.
test('n\'inclut pas un terrain sans créneau disponible', function () {
    $joueur = User::factory()->create(['sports_pratiques' => ['foot']]);
    $terrainSansCreneauLibre = Terrain::factory()->create(['sport' => 'foot']);
    Creneau::factory()->create(['terrain_id' => $terrainSansCreneauLibre->id, 'statut' => 'reserve', 'debut' => now()->addDay()]);
    Sanctum::actingAs($joueur);

    $this->getJson('/api/recommandations/terrains')->assertOk()->assertJsonCount(0);
});

// Aucun signal exploitable (ni sport déclaré, ni historique) : aucune recommandation devinée.
test('ne recommande rien sans aucun signal (ni sport déclaré, ni historique)', function () {
    $joueur = User::factory()->create(['sports_pratiques' => []]);
    Terrain::factory()->create(['sport' => 'foot'])->creneaux()->save(Creneau::factory()->make(['statut' => 'disponible', 'debut' => now()->addDay()]));
    Sanctum::actingAs($joueur);

    $this->getJson('/api/recommandations/terrains')->assertOk()->assertJsonCount(0);
});

// tarifMin = le tarif le plus bas parmi les créneaux disponibles du terrain, pas un tarif unique.
test('tarifMin reflète le créneau disponible le moins cher du terrain', function () {
    $joueur = User::factory()->create(['sports_pratiques' => ['tennis']]);
    $terrain = Terrain::factory()->create(['sport' => 'tennis']);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay(), 'tarif' => 15000]);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDays(2), 'tarif' => 9000]);
    Sanctum::actingAs($joueur);

    $this->getJson('/api/recommandations/terrains')->assertOk()->assertJsonFragment(['tarifMin' => 9000]);
});
