<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

// TC-003-01 : forme exacte de Profile (types.ts) — utilisateurId, nom, ville, photoUrl, sports.
test('affiche le profil de l\'utilisateur connecté', function () {
    $utilisateur = User::factory()->create([
        'nom' => 'Awa Diallo',
        'ville' => 'Dakar',
        'sports_pratiques' => ['foot'],
    ]);
    Sanctum::actingAs($utilisateur);

    $reponse = $this->getJson('/api/profile');

    $reponse->assertOk()->assertJson([
        'utilisateurId' => $utilisateur->id,
        'nom' => 'Awa Diallo',
        'ville' => 'Dakar',
        'photoUrl' => null,
        'sports' => ['foot'],
    ]);
});

test('refuse de consulter le profil sans authentification', function () {
    $this->getJson('/api/profile')->assertUnauthorized();
});

// TC-003-03 : modification des champs texte.
test('met à jour le nom, la ville et les sports du profil', function () {
    $utilisateur = User::factory()->create(['nom' => 'Ancien nom']);
    Sanctum::actingAs($utilisateur);

    $reponse = $this->patchJson('/api/profile', [
        'nom' => 'Awa Diallo',
        'ville' => 'Abidjan',
        'sports' => ['tennis', 'basket'],
    ]);

    $reponse->assertOk()->assertJson([
        'nom' => 'Awa Diallo',
        'ville' => 'Abidjan',
        'sports' => ['tennis', 'basket'],
    ]);
    expect($utilisateur->fresh()->nom)->toBe('Awa Diallo');
});

// TC-003-02 : message exact attendu par updateProfile (profileApi.ts, body?.message).
test('refuse de mettre à jour le profil si le nom est vidé', function () {
    $utilisateur = User::factory()->create();
    Sanctum::actingAs($utilisateur);

    $reponse = $this->patchJson('/api/profile', ['nom' => '', 'ville' => 'Dakar', 'sports' => ['foot']]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Le nom est requis pour être identifiable par les autres utilisateurs.']);
});

// TC-003-05 : la ville est optionnelle, mais au moins un sport reste requis (validateProfilePayload).
test('refuse de mettre à jour le profil si tous les sports sont décochés', function () {
    $utilisateur = User::factory()->create();
    Sanctum::actingAs($utilisateur);

    $reponse = $this->patchJson('/api/profile', ['nom' => 'Awa Diallo', 'sports' => []]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => 'Sélectionne au moins un sport pratiqué.']);
});

test('accepte une mise à jour sans ville renseignée (champ optionnel)', function () {
    $utilisateur = User::factory()->create();
    Sanctum::actingAs($utilisateur);

    $reponse = $this->patchJson('/api/profile', ['nom' => 'Awa Diallo', 'sports' => ['foot']]);

    $reponse->assertOk()->assertJson(['ville' => null]);
});

// TC-003-04 : upload de la photo — champ `photo` (contrat exact avec ProfileForm.tsx/
// ProfileScreen.tsx), réponse { photoUrl } uniquement (pas le profil complet).
test('envoie une nouvelle photo de profil et renvoie son URL', function () {
    Storage::fake('public');
    $utilisateur = User::factory()->create();
    Sanctum::actingAs($utilisateur);

    $reponse = $this->postJson('/api/profile/photo', [
        'photo' => UploadedFile::fake()->image('photo.jpg'),
    ]);

    $reponse->assertOk()->assertJsonStructure(['photoUrl']);
    expect($utilisateur->fresh()->photo_url)->not->toBeNull();
    Storage::disk('public')->assertExists(
        str($reponse->json('photoUrl'))->after('/storage/')->toString()
    );
});

test('refuse un fichier qui n\'est pas une image', function () {
    Storage::fake('public');
    $utilisateur = User::factory()->create();
    Sanctum::actingAs($utilisateur);

    $reponse = $this->postJson('/api/profile/photo', [
        'photo' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
    ]);

    $reponse->assertStatus(422)
        ->assertJson(['message' => "Le fichier envoyé n'est pas une image valide."]);
});
