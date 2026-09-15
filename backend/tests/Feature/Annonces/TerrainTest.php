<?php

use App\Contracts\GeocodingService;
use App\Models\Notification;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

// Stub du géocodage : les tests n'appellent jamais le vrai service Nominatim (pas d'accès réseau
// garanti dans cet environnement, et un vrai appel externe n'a pas sa place dans une suite de
// tests reproductible) — voir NominatimGeocodingService.php.
beforeEach(function () {
    $this->app->bind(GeocodingService::class, fn () => new class implements GeocodingService
    {
        public function geocoder(string $adresse): array
        {
            return ['latitude' => 14.7167, 'longitude' => -17.4677];
        }
    });
});

// Palier minimal valide, réutilisé partout où le contenu exact du palier n'est pas ce qui est
// testé — un seul palier "tout ou rien" (RF-021, correction du 9 septembre 2026).
function unPalier(): array
{
    return [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]];
}

// TC-004-02 : contrat exact de createTerrain (terrainApi.ts).
test('publie une annonce avec des données valides', function () {
    $proprietaire = User::factory()->create();
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson('/api/terrains', [
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
        'equipements' => ['vestiaires'],
        'paliers' => unPalier(),
    ]);

    $reponse->assertCreated()->assertJson([
        'proprietaireId' => $proprietaire->id,
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
        'latitude' => 14.7167,
        'longitude' => -17.4677,
        'type' => null,
        'equipements' => ['vestiaires'],
        'photos' => [],
        'paliers' => [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]],
    ]);
});

test('publie une annonce sans type ni équipements (champs optionnels)', function () {
    Sanctum::actingAs(User::factory()->create());

    $reponse = $this->postJson('/api/terrains', [
        'sport' => 'tennis',
        'adresse' => 'Avenue 5, Dakar',
        'paliers' => unPalier(),
    ]);

    $reponse->assertCreated()->assertJson(['type' => null, 'equipements' => []]);
});

// TC-004-01 : validation — mêmes messages que validateCreateTerrainPayload (validation.ts).
test('refuse une annonce sans sport', function () {
    Sanctum::actingAs(User::factory()->create());

    $reponse = $this->postJson('/api/terrains', ['adresse' => 'Rue 12, Dakar', 'paliers' => unPalier()]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Sélectionne le sport pratiqué sur ce terrain.']);
});

test('refuse une annonce sans adresse', function () {
    Sanctum::actingAs(User::factory()->create());

    $reponse = $this->postJson('/api/terrains', ['sport' => 'foot', 'paliers' => unPalier()]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => "L'adresse est requise pour que les joueurs puissent te trouver."]);
});

test('refuse de publier sans authentification', function () {
    $this->postJson('/api/terrains', ['sport' => 'foot', 'adresse' => 'Rue 12, Dakar', 'paliers' => unPalier()])
        ->assertUnauthorized();
});

// RF-021 (correction du 9 septembre 2026) : un terrain ne peut plus être publié sans politique
// d'annulation configurée — ni avec un tableau absent, ni avec un tableau vide.
test('refuse de publier un terrain sans aucun palier d\'annulation', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/terrains', ['sport' => 'foot', 'adresse' => 'Rue 12, Dakar'])
        ->assertStatus(422)
        ->assertJson(['message' => "Configure au moins un palier d'annulation avant de publier ce terrain."]);
});

test('refuse de publier un terrain avec un tableau de paliers vide', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/terrains', ['sport' => 'foot', 'adresse' => 'Rue 12, Dakar', 'paliers' => []])
        ->assertStatus(422)
        ->assertJson(['message' => "Configure au moins un palier d'annulation avant de publier ce terrain."]);
});

// RF-021 : sans taux de frais explicite, le backend calcule le taux par défaut (barème dégressif,
// config('reservation.bareme_frais_annulation_defaut')) et avertit le propriétaire.
test('calcule le taux de frais par défaut et avertit le propriétaire quand aucun taux n\'est fourni', function () {
    $proprietaire = User::factory()->create();
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson('/api/terrains', [
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
        'paliers' => unPalier(),
    ]);

    // 1 seul terrain détenu → 2% selon le barème par défaut.
    $reponse->assertCreated()->assertJson(['fraisAnnulationPourcentage' => 2]);
    expect(Notification::where('destinataire_id', $proprietaire->id)->where('type', 'frais_annulation_defaut_attribue')->exists())->toBeTrue();
});

test('un deuxième terrain du même propriétaire reçoit le taux par défaut suivant du barème', function () {
    $proprietaire = User::factory()->create();
    Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson('/api/terrains', [
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
        'paliers' => unPalier(),
    ]);

    // 2 terrains détenus (celui déjà existant + celui-ci) → 1,5% selon le barème.
    $reponse->assertCreated()->assertJson(['fraisAnnulationPourcentage' => 1.5]);
});

test('respecte un taux de frais explicite sans avertir le propriétaire', function () {
    $proprietaire = User::factory()->create();
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson('/api/terrains', [
        'sport' => 'foot',
        'adresse' => 'Rue 12, Dakar',
        'paliers' => unPalier(),
        'fraisAnnulationPourcentage' => 5,
    ]);

    $reponse->assertCreated()->assertJson(['fraisAnnulationPourcentage' => 5]);
    expect(Notification::where('destinataire_id', $proprietaire->id)->where('type', 'frais_annulation_defaut_attribue')->exists())->toBeFalse();
});

// TC-006-01 : consultation d'une annonce déjà publiée (chargement pour l'écran d'édition).
test('affiche une annonce à son propriétaire', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $this->getJson("/api/terrains/{$terrain->id}")
        ->assertOk()
        ->assertJson(['id' => $terrain->id]);
});

test('refuse de consulter l\'annonce d\'un autre utilisateur', function () {
    $terrain = Terrain::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/terrains/{$terrain->id}")->assertForbidden();
});

// TC-006-02 : modification d'une annonce.
test('modifie une annonce et re-géocode si l\'adresse change', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'adresse' => 'Ancienne adresse']);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->patchJson("/api/terrains/{$terrain->id}", [
        'sport' => 'basket',
        'adresse' => 'Nouvelle adresse, Dakar',
        'equipements' => ['eclairage'],
        'paliers' => unPalier(),
    ]);

    $reponse->assertOk()->assertJson([
        'sport' => 'basket',
        'adresse' => 'Nouvelle adresse, Dakar',
        'latitude' => 14.7167,
        'longitude' => -17.4677,
    ]);
});

test('refuse de modifier l\'annonce d\'un autre utilisateur', function () {
    $terrain = Terrain::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson("/api/terrains/{$terrain->id}", ['sport' => 'foot', 'adresse' => 'Rue 12, Dakar', 'paliers' => unPalier()])
        ->assertForbidden();
});

// RF-021 : `paliers` est toujours envoyé au complet par le frontend (comme `equipements`) —
// remplace l'ensemble existant plutôt que de le fusionner.
test('remplace entièrement les paliers existants lors d\'une modification', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $terrain->paliers()->create(['delai_minutes' => 60, 'pourcentage_remboursement' => 0]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->patchJson("/api/terrains/{$terrain->id}", [
        'sport' => $terrain->sport,
        'adresse' => $terrain->adresse,
        'paliers' => [['delaiMinutes' => 2880, 'pourcentageRemboursement' => 100]],
    ]);

    $reponse->assertOk()->assertJson(['paliers' => [['delaiMinutes' => 2880, 'pourcentageRemboursement' => 100]]]);
    expect($terrain->paliers()->count())->toBe(1);
});

test('refuse de modifier une annonce en vidant ses paliers', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $this->patchJson("/api/terrains/{$terrain->id}", [
        'sport' => $terrain->sport,
        'adresse' => $terrain->adresse,
        'paliers' => [],
    ])->assertStatus(422);
});

// RF-021 : ne recalcule/ne renotifie PAS à chaque sauvegarde quand fraisAnnulationPourcentage est
// absent du payload — seul un reset explicite (valeur `null` envoyée) redéclenche l'avertissement.
test('conserve le taux de frais existant quand le champ est absent de la modification', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'frais_annulation_pourcentage' => 7]);
    Sanctum::actingAs($proprietaire);

    $this->patchJson("/api/terrains/{$terrain->id}", [
        'sport' => $terrain->sport,
        'adresse' => $terrain->adresse,
        'paliers' => unPalier(),
    ])->assertJson(['fraisAnnulationPourcentage' => 7]);
    expect(Notification::where('destinataire_id', $proprietaire->id)->count())->toBe(0);
});

test('recalcule et avertit quand le propriétaire redemande explicitement le taux par défaut', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'frais_annulation_pourcentage' => 7]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->patchJson("/api/terrains/{$terrain->id}", [
        'sport' => $terrain->sport,
        'adresse' => $terrain->adresse,
        'paliers' => unPalier(),
        'fraisAnnulationPourcentage' => null,
    ]);

    $reponse->assertJson(['fraisAnnulationPourcentage' => 2]);
    expect(Notification::where('destinataire_id', $proprietaire->id)->where('type', 'frais_annulation_defaut_attribue')->exists())->toBeTrue();
});

// TC-006-03 : retrait d'une annonce.
test('retire sa propre annonce', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $this->deleteJson("/api/terrains/{$terrain->id}")->assertNoContent();

    expect(Terrain::find($terrain->id))->toBeNull();
});

test('refuse de retirer l\'annonce d\'un autre utilisateur', function () {
    $terrain = Terrain::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->deleteJson("/api/terrains/{$terrain->id}")->assertForbidden();
    expect(Terrain::find($terrain->id))->not->toBeNull();
});

// TC-004-03 : upload de photo — contrat { photoUrl } uniquement (pas le terrain complet).
test('ajoute une photo à une annonce', function () {
    Storage::fake('public');
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson("/api/terrains/{$terrain->id}/photos", [
        'photo' => UploadedFile::fake()->image('terrain.jpg'),
    ]);

    $reponse->assertOk()->assertJsonStructure(['photoUrl']);
    expect($terrain->fresh()->photos)->toHaveCount(1);
});

test('accumule plusieurs photos plutôt que de les remplacer', function () {
    Storage::fake('public');
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    Sanctum::actingAs($proprietaire);

    $this->postJson("/api/terrains/{$terrain->id}/photos", ['photo' => UploadedFile::fake()->image('un.jpg')]);
    $this->postJson("/api/terrains/{$terrain->id}/photos", ['photo' => UploadedFile::fake()->image('deux.jpg')]);

    expect($terrain->fresh()->photos)->toHaveCount(2);
});
