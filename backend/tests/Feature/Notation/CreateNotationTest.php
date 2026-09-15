<?php

use App\Models\Creneau;
use App\Models\Notation;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/**
 * @return array{joueur: User, proprietaire: User, reservation: Reservation}
 */
function creerReservationTerminee(string $statut = 'confirmee', bool $creneauPasse = true): array
{
    $joueur = User::factory()->create();
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create([
        'terrain_id' => $terrain->id,
        'debut' => $creneauPasse ? now()->subHours(3) : now()->addHours(3),
        'fin' => $creneauPasse ? now()->subHours(2) : now()->addHours(4),
    ]);
    $reservation = Reservation::factory()->create([
        'joueur_id' => $joueur->id,
        'creneau_id' => $creneau->id,
        'statut' => $statut,
    ]);

    return ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation];
}

// TC-016-01 : contrat exact de creerNotation (notationApi.ts) — un joueur note le propriétaire
// après une session terminée.
test('note le propriétaire après une session terminée', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs($joueur);

    $reponse = $this->postJson('/api/notations', [
        'reservationId' => $reservation->id,
        'cibleId' => $proprietaire->id,
        'note' => 5,
        'commentaire' => 'Super session, très ponctuel.',
    ]);

    $reponse->assertCreated()->assertJson([
        'reservationId' => $reservation->id,
        'auteurId' => $joueur->id,
        'cibleId' => $proprietaire->id,
        'note' => 5,
        'commentaire' => 'Super session, très ponctuel.',
    ]);
});

// La notation fonctionne dans les deux sens — RF-016 ne réserve pas la notation au seul joueur.
test('note le joueur après une session terminée (sens propriétaire → joueur)', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs($proprietaire);

    $this->postJson('/api/notations', [
        'reservationId' => $reservation->id,
        'cibleId' => $joueur->id,
        'note' => 4,
    ])->assertCreated();
});

// RF-016 : "commentaire optionnel".
test('accepte une notation sans commentaire', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs($joueur);

    $this->postJson('/api/notations', [
        'reservationId' => $reservation->id,
        'cibleId' => $proprietaire->id,
        'note' => 3,
    ])->assertCreated()->assertJson(['commentaire' => null]);
});

test('refuse une note hors de l\'échelle 1-5', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs($joueur);

    $this->postJson('/api/notations', [
        'reservationId' => $reservation->id,
        'cibleId' => $proprietaire->id,
        'note' => 6,
    ])->assertStatus(422)->assertJson(['message' => 'Sélectionne une note entre 1 et 5.']);
});

test('refuse de noter une session pas encore confirmée', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee('en_attente_paiement');
    Sanctum::actingAs($joueur);

    $this->postJson('/api/notations', ['reservationId' => $reservation->id, 'cibleId' => $proprietaire->id, 'note' => 5])
        ->assertStatus(409)
        ->assertJson(['message' => "Cette session n'est pas encore terminée."]);
});

// TC-016-02 : "après la session" (RF-016) — confirmée mais pas encore passée ne compte pas.
test('refuse de noter une session confirmée mais pas encore passée', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee('confirmee', creneauPasse: false);
    Sanctum::actingAs($joueur);

    $this->postJson('/api/notations', ['reservationId' => $reservation->id, 'cibleId' => $proprietaire->id, 'note' => 5])
        ->assertStatus(409);
});

// Vérification explicitement demandée par notationApi.ts : l'auteur et la cible doivent être
// tous deux parties à la réservation.
test('refuse si l\'auteur ne fait pas partie de la réservation', function () {
    ['proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs(User::factory()->create()); // un tiers

    $this->postJson('/api/notations', ['reservationId' => $reservation->id, 'cibleId' => $proprietaire->id, 'note' => 5])
        ->assertForbidden();
});

test('refuse si la cible ne fait pas partie de la réservation', function () {
    ['joueur' => $joueur, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs($joueur);

    $this->postJson('/api/notations', [
        'reservationId' => $reservation->id,
        'cibleId' => User::factory()->create()->id, // un tiers
        'note' => 5,
    ])->assertForbidden();
});

// Garde-fou d'intégrité (voir la migration) : une seule notation par (réservation, auteur).
test('refuse de noter deux fois la même session', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();
    Sanctum::actingAs($joueur);
    Notation::factory()->create(['reservation_id' => $reservation->id, 'auteur_id' => $joueur->id, 'cible_id' => $proprietaire->id]);

    $this->postJson('/api/notations', ['reservationId' => $reservation->id, 'cibleId' => $proprietaire->id, 'note' => 5])
        ->assertStatus(409)
        ->assertJson(['message' => 'Tu as déjà noté cette session.']);
});

test('refuse de noter sans authentification', function () {
    ['proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationTerminee();

    $this->postJson('/api/notations', ['reservationId' => $reservation->id, 'cibleId' => $proprietaire->id, 'note' => 5])
        ->assertUnauthorized();
});
