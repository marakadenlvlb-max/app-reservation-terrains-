<?php

use App\Models\Creneau;
use App\Models\Terrain;

// TC-007-01 : contrat exact de searchTerrains (rechercheApi.ts) — endpoint public.
test('recherche publique sans filtre, sans authentification', function () {
    $terrain = Terrain::factory()->create(['sport' => 'foot']);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains');

    $reponse->assertOk()->assertJsonCount(1);
    $reponse->assertJsonFragment(['terrainId' => $terrain->id, 'sport' => 'foot']);
});

test('filtre par sport', function () {
    $terrainFoot = Terrain::factory()->create(['sport' => 'foot']);
    $terrainTennis = Terrain::factory()->create(['sport' => 'tennis']);
    Creneau::factory()->create(['terrain_id' => $terrainFoot->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrainTennis->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains?sport=tennis');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['terrainId' => $terrainTennis->id]);
});

// TC-007-02 : "localisation" filtre en sous-texte sur l'adresse.
test('filtre par localisation (sous-texte de l\'adresse)', function () {
    $terrain = Terrain::factory()->create(['adresse' => 'Rue 12, Almadies, Dakar']);
    $autreTerrain = Terrain::factory()->create(['adresse' => 'Avenue 5, Plateau, Dakar']);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $autreTerrain->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains?localisation=Almadies');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['terrainId' => $terrain->id]);
});

// TC-008-01 : date/heure — RF-008, seuls les créneaux qui correspondent doivent apparaître.
test('filtre par date', function () {
    $terrain = Terrain::factory()->create();
    $creneauBonJour = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => '2026-10-01 18:00:00']);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => '2026-10-02 18:00:00']);

    $reponse = $this->getJson('/api/recherche/terrains?date=2026-10-01');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['creneauId' => $creneauBonJour->id]);
});

test('filtre par heure : ne garde que les créneaux à partir de cette heure', function () {
    $terrain = Terrain::factory()->create();
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => '2026-10-01 10:00:00']);
    $creneauTardif = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => '2026-10-01 19:00:00']);

    $reponse = $this->getJson('/api/recherche/terrains?date=2026-10-01&heure=18:00');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['creneauId' => $creneauTardif->id]);
});

// TC-023-01 : prixMax filtre CRENEAU.tarif.
test('filtre par prix maximum', function () {
    $terrain = Terrain::factory()->create();
    $creneauAbordable = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay(), 'tarif' => 8000]);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay(), 'tarif' => 25000]);

    $reponse = $this->getJson('/api/recherche/terrains?prixMax=10000');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['creneauId' => $creneauAbordable->id]);
});

// TC-023-02 : equipements — ne garder que les terrains possédant TOUS les équipements sélectionnés.
test('filtre par équipements : exige la totalité des équipements sélectionnés', function () {
    $terrainComplet = Terrain::factory()->create(['equipements' => ['vestiaires', 'eclairage']]);
    $terrainPartiel = Terrain::factory()->create(['equipements' => ['vestiaires']]);
    Creneau::factory()->create(['terrain_id' => $terrainComplet->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrainPartiel->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains?equipements=vestiaires,eclairage');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['terrainId' => $terrainComplet->id]);
});

// TC-009-01 : distance calculée et tri par proximité quand une position est fournie (US-09).
test('calcule la distance et trie du plus proche au plus loin quand une position est fournie', function () {
    // Dakar (position de recherche) ~ (14.7167, -17.4677).
    $terrainProche = Terrain::factory()->create(['latitude' => 14.72, 'longitude' => -17.47]);
    $terrainLoin = Terrain::factory()->create(['latitude' => 16.0, 'longitude' => -16.0]);
    Creneau::factory()->create(['terrain_id' => $terrainProche->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrainLoin->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains?latitude=14.7167&longitude=-17.4677');

    $reponse->assertOk();
    $resultats = $reponse->json();
    expect($resultats[0]['terrainId'])->toBe($terrainProche->id);
    expect($resultats[0]['distanceKm'])->toBeLessThan($resultats[1]['distanceKm']);
});

test('n\'annonce pas de distance quand aucune position n\'est fournie', function () {
    $terrain = Terrain::factory()->create(['latitude' => 14.72, 'longitude' => -17.47]);
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains');

    expect($reponse->json()[0])->not->toHaveKey('distanceKm');
});

// TC-023-03 : distanceMaxKm exclut les résultats hors rayon.
test('exclut les résultats au-delà de distanceMaxKm', function () {
    $terrainProche = Terrain::factory()->create(['latitude' => 14.72, 'longitude' => -17.47]);
    $terrainLoin = Terrain::factory()->create(['latitude' => 16.0, 'longitude' => -16.0]);
    Creneau::factory()->create(['terrain_id' => $terrainProche->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);
    Creneau::factory()->create(['terrain_id' => $terrainLoin->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains?latitude=14.7167&longitude=-17.4677&distanceMaxKm=50');

    $reponse->assertOk()->assertJsonCount(1)->assertJsonFragment(['terrainId' => $terrainProche->id]);
});

// Un terrain sans coordonnées connues (géocodage jamais confirmé) est exclu par prudence dès
// qu'un rayon est explicitement demandé — on ne peut pas garantir qu'il y est.
test('exclut un terrain sans coordonnées connues quand distanceMaxKm est actif', function () {
    $terrainSansPosition = Terrain::factory()->create(['latitude' => null, 'longitude' => null]);
    Creneau::factory()->create(['terrain_id' => $terrainSansPosition->id, 'statut' => 'disponible', 'debut' => now()->addDay()]);

    $reponse = $this->getJson('/api/recherche/terrains?latitude=14.7167&longitude=-17.4677&distanceMaxKm=50');

    $reponse->assertOk()->assertJsonCount(0);
});

// RF-008 : seuls les créneaux "réellement disponibles" apparaissent.
test('n\'inclut pas un créneau déjà réservé', function () {
    $terrain = Terrain::factory()->create();
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'reserve', 'debut' => now()->addDay()]);

    $this->getJson('/api/recherche/terrains')->assertOk()->assertJsonCount(0);
});

test('n\'inclut pas un créneau déjà commencé', function () {
    $terrain = Terrain::factory()->create();
    Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'disponible', 'debut' => now()->subHour(), 'fin' => now()->addMinutes(30)]);

    $this->getJson('/api/recherche/terrains')->assertOk()->assertJsonCount(0);
});

test('refuse un sport invalide', function () {
    $this->getJson('/api/recherche/terrains?sport=rugby')->assertStatus(422);
});
