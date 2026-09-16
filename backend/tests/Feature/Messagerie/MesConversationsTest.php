<?php

use App\Models\Creneau;
use App\Models\Message;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/**
 * @return array{0: Reservation, 1: User, 2: User} [réservation, joueur, propriétaire]
 */
function creerReservationAvecMessage(?string $contenu = null, ?string $createdAt = null): array
{
    $joueur = User::factory()->create(['nom' => 'Awa Diallo']);
    $proprietaire = User::factory()->create(['nom' => 'Moussa Ba']);
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'sport' => 'foot', 'adresse' => 'Rue 12, Dakar']);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id]);
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneau->id]);
    Message::factory()->create([
        'reservation_id' => $reservation->id,
        'auteur_id' => $joueur->id,
        'contenu' => $contenu ?? 'On confirme pour 18h ?',
        'created_at' => $createdAt ?? now(),
    ]);

    return [$reservation, $joueur, $proprietaire];
}

// US-27/US-28 : contrat exact de ConversationApercu (messagerie-core/types.ts) côté joueur —
// autrePartie = le propriétaire du terrain, dernierMessage renseigné.
test('le joueur voit ses conversations, avec le propriétaire comme autre partie', function () {
    [$reservation, $joueur, $proprietaire] = creerReservationAvecMessage('On confirme pour 18h ?');
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson('/api/messagerie/mes-conversations');

    $reponse->assertOk()->assertJsonCount(1)->assertJson([[
        'reservationId' => $reservation->id,
        'terrain' => ['sport' => 'foot', 'adresse' => 'Rue 12, Dakar'],
        'autrePartie' => ['id' => $proprietaire->id, 'nom' => 'Moussa Ba'],
        'dernierMessage' => ['contenu' => 'On confirme pour 18h ?'],
    ]]);
});

test('le propriétaire voit ses conversations, avec le joueur comme autre partie', function () {
    [$reservation, $joueur, $proprietaire] = creerReservationAvecMessage();
    Sanctum::actingAs($proprietaire);

    $this->getJson('/api/messagerie/mes-conversations')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJson([[
            'reservationId' => $reservation->id,
            'autrePartie' => ['id' => $joueur->id, 'nom' => 'Awa Diallo'],
        ]]);
});

// Décision métier tranchée dans ObtenirMesConversations (pas imposée par le SRS) : une réservation
// sans aucun message n'est pas encore une "conversation" à afficher.
test('n\'inclut pas une réservation qui n\'a encore aucun message', function () {
    $joueur = User::factory()->create();
    $creneau = Creneau::factory()->create();
    Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneau->id]);
    Sanctum::actingAs($joueur);

    $this->getJson('/api/messagerie/mes-conversations')->assertOk()->assertJsonCount(0);
});

test('n\'affiche pas les conversations d\'un utilisateur qui n\'est partie à aucune réservation', function () {
    creerReservationAvecMessage();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/messagerie/mes-conversations')->assertOk()->assertJsonCount(0);
});

test('trie les conversations de la plus récemment active à la plus ancienne', function () {
    $joueur = User::factory()->create();

    $creneauAncien = Creneau::factory()->create();
    $reservationAncienne = Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneauAncien->id]);
    Message::factory()->create(['reservation_id' => $reservationAncienne->id, 'auteur_id' => $joueur->id, 'created_at' => now()->subDays(2)]);

    $creneauRecent = Creneau::factory()->create();
    $reservationRecente = Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneauRecent->id]);
    Message::factory()->create(['reservation_id' => $reservationRecente->id, 'auteur_id' => $joueur->id, 'created_at' => now()]);

    Sanctum::actingAs($joueur);

    $reponse = $this->getJson('/api/messagerie/mes-conversations')->assertOk();

    expect($reponse->json('0.reservationId'))->toBe($reservationRecente->id);
    expect($reponse->json('1.reservationId'))->toBe($reservationAncienne->id);
});

test('affiche un tableau vide plutôt qu\'une erreur quand il n\'y a encore aucune conversation', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/messagerie/mes-conversations')->assertOk()->assertExactJson([]);
});

test('refuse de consulter mes-conversations sans authentification', function () {
    $this->getJson('/api/messagerie/mes-conversations')->assertUnauthorized();
});
