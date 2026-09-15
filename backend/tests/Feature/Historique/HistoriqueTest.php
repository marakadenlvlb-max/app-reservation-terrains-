<?php

use App\Models\Creneau;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/**
 * @return array{joueur: User, proprietaire: User, reservation: Reservation}
 */
function creerReservationPourHistorique(): array
{
    $joueur = User::factory()->create(['nom' => 'Awa Diallo']);
    $proprietaire = User::factory()->create(['nom' => 'Moussa Ba']);
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id, 'sport' => 'foot', 'adresse' => 'Rue 12, Dakar']);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id]);
    $reservation = Reservation::factory()->create([
        'joueur_id' => $joueur->id,
        'creneau_id' => $creneau->id,
        'statut' => 'confirmee',
        'montant' => 15000,
    ]);

    return ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation];
}

// TC-018-01 : contrat exact de HistoriqueReservation (types.ts) côté joueur — autrePartie = le
// propriétaire du terrain.
test('affiche l\'historique du joueur, avec le propriétaire comme autre partie', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationPourHistorique();
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson('/api/reservations/mes-reservations');

    $reponse->assertOk()->assertJsonCount(1)->assertJson([[
        'id' => $reservation->id,
        'statut' => 'confirmee',
        'montant' => 15000,
        'terrain' => ['sport' => 'foot', 'adresse' => 'Rue 12, Dakar'],
        'autrePartie' => ['id' => $proprietaire->id, 'nom' => 'Moussa Ba'],
    ]])->assertJsonStructure([['id', 'createdAt', 'terrain' => ['id'], 'creneau' => ['id', 'debut', 'fin']]]);
});

test('n\'affiche pas les réservations d\'un autre joueur', function () {
    creerReservationPourHistorique();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/reservations/mes-reservations')->assertOk()->assertJsonCount(0);
});

// TC-019-01 : contrat exact côté propriétaire — autrePartie = le joueur qui a réservé.
test('affiche l\'historique du propriétaire, avec le joueur comme autre partie', function () {
    ['joueur' => $joueur, 'proprietaire' => $proprietaire, 'reservation' => $reservation] = creerReservationPourHistorique();
    Sanctum::actingAs($proprietaire);

    $this->getJson('/api/reservations/recues')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJson([[
            'id' => $reservation->id,
            'autrePartie' => ['id' => $joueur->id, 'nom' => 'Awa Diallo'],
        ]]);
});

test('n\'affiche pas les réservations reçues sur le terrain d\'un autre propriétaire', function () {
    creerReservationPourHistorique();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/reservations/recues')->assertOk()->assertJsonCount(0);
});

test('trie l\'historique du plus récent au plus ancien', function () {
    $joueur = User::factory()->create();
    $ancienne = Reservation::factory()->create(['joueur_id' => $joueur->id, 'created_at' => now()->subDays(2)]);
    $recente = Reservation::factory()->create(['joueur_id' => $joueur->id, 'created_at' => now()]);
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson('/api/reservations/mes-reservations')->assertOk();

    expect($reponse->json('0.id'))->toBe($recente->id);
    expect($reponse->json('1.id'))->toBe($ancienne->id);
});

test('affiche un tableau vide plutôt qu\'une erreur quand il n\'y a encore aucune réservation', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/reservations/mes-reservations')->assertOk()->assertExactJson([]);
    $this->getJson('/api/reservations/recues')->assertOk()->assertExactJson([]);
});

test('refuse de consulter l\'historique sans authentification', function () {
    $this->getJson('/api/reservations/mes-reservations')->assertUnauthorized();
    $this->getJson('/api/reservations/recues')->assertUnauthorized();
});
