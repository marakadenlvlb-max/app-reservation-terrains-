<?php

use App\Models\Creneau;
use App\Models\Message;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// Réservation avec ses deux parties bien identifiées (joueur, propriétaire du terrain via le
// créneau réservé) — les seuls autorisés à voir/écrire dans sa conversation (RF-023).
function reservationAvecParties(): array
{
    $joueur = User::factory()->create();
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id]);
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneau->id]);

    return [$reservation, $joueur, $proprietaire];
}

// TC-024-01 : contrat exact de fetchMessages (messagerieApi.ts).
test('le joueur consulte la conversation de sa réservation', function () {
    [$reservation, $joueur, $proprietaire] = reservationAvecParties();
    Message::factory()->create(['reservation_id' => $reservation->id, 'auteur_id' => $proprietaire->id, 'contenu' => 'Le terrain est-il couvert ?']);
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson("/api/reservations/{$reservation->id}/messages");

    $reponse->assertOk()->assertJsonCount(1);
    $reponse->assertJson([['contenu' => 'Le terrain est-il couvert ?', 'estDeMoi' => false]]);
});

// `estDeMoi` dépend de qui interroge — le même message doit s'afficher différemment pour chacun.
test('estDeMoi reflète l\'utilisateur qui consulte, pas un état stocké', function () {
    [$reservation, $joueur, $proprietaire] = reservationAvecParties();
    Message::factory()->create(['reservation_id' => $reservation->id, 'auteur_id' => $joueur->id]);

    Sanctum::actingAs($joueur);
    $this->getJson("/api/reservations/{$reservation->id}/messages")->assertJson([['estDeMoi' => true]]);

    Sanctum::actingAs($proprietaire);
    $this->getJson("/api/reservations/{$reservation->id}/messages")->assertJson([['estDeMoi' => false]]);
});

test('affiche les messages dans l\'ordre chronologique', function () {
    [$reservation, $joueur] = reservationAvecParties();
    $premier = Message::factory()->create(['reservation_id' => $reservation->id, 'contenu' => 'Premier', 'created_at' => now()->subMinutes(10)]);
    $second = Message::factory()->create(['reservation_id' => $reservation->id, 'contenu' => 'Second', 'created_at' => now()]);
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson("/api/reservations/{$reservation->id}/messages");

    expect($reponse->json('0.id'))->toBe($premier->id);
    expect($reponse->json('1.id'))->toBe($second->id);
});

// TC-024-02 : seules les deux parties de la réservation peuvent consulter la conversation.
test('refuse de consulter la conversation d\'une réservation à laquelle on ne participe pas', function () {
    [$reservation] = reservationAvecParties();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/reservations/{$reservation->id}/messages")->assertForbidden();
});

test('refuse de consulter une conversation sans authentification', function () {
    [$reservation] = reservationAvecParties();

    $this->getJson("/api/reservations/{$reservation->id}/messages")->assertUnauthorized();
});

// TC-024-03 : contrat exact de envoyerMessage (messagerieApi.ts).
test('le propriétaire envoie un message dans la conversation', function () {
    [$reservation, , $proprietaire] = reservationAvecParties();
    Sanctum::actingAs($proprietaire);

    $reponse = $this->postJson("/api/reservations/{$reservation->id}/messages", ['contenu' => 'Oui, terrain couvert.']);

    $reponse->assertCreated()->assertJson([
        'reservationId' => $reservation->id,
        'contenu' => 'Oui, terrain couvert.',
        'estDeMoi' => true,
    ]);
    expect(Message::where('reservation_id', $reservation->id)->where('auteur_id', $proprietaire->id)->exists())->toBeTrue();
});

test('refuse d\'envoyer un message vide', function () {
    [$reservation, $joueur] = reservationAvecParties();
    Sanctum::actingAs($joueur);

    $this->postJson("/api/reservations/{$reservation->id}/messages", ['contenu' => ''])
        ->assertStatus(422)
        ->assertJson(['message' => "Écris un message avant de l'envoyer."]);
});

test('refuse d\'envoyer un message à une réservation à laquelle on ne participe pas', function () {
    [$reservation] = reservationAvecParties();
    Sanctum::actingAs(User::factory()->create());

    $this->postJson("/api/reservations/{$reservation->id}/messages", ['contenu' => 'Salut'])->assertForbidden();
});

test('refuse d\'envoyer un message sans authentification', function () {
    [$reservation] = reservationAvecParties();

    $this->postJson("/api/reservations/{$reservation->id}/messages", ['contenu' => 'Salut'])->assertUnauthorized();
});
