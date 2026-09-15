<?php

use App\Models\Creneau;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

// TC-010-01 : contrat exact de initierReservation (reservationApi.ts) — verrouille le créneau et
// crée la réservation en 'en_attente_paiement'.
test('initie une réservation et verrouille le créneau', function () {
    $joueur = User::factory()->create();
    $creneau = Creneau::factory()->create(['tarif' => 15000, 'statut' => 'disponible']);
    Sanctum::actingAs($joueur);

    $reponse = $this->postJson('/api/reservations', ['creneauId' => $creneau->id]);

    $reponse->assertCreated()->assertJson([
        'creneauId' => $creneau->id,
        'joueurId' => $joueur->id,
        'statut' => 'en_attente_paiement',
        'montant' => 15000,
    ])->assertJsonStructure(['id', 'createdAt', 'expireA']);

    expect($creneau->fresh()->statut)->toBe('reserve');
});

// TC-010-02 : le montant vient du tarif du créneau, jamais du payload (non envoyé par le frontend).
test('dérive le montant du tarif du créneau', function () {
    Sanctum::actingAs(User::factory()->create());
    $creneau = Creneau::factory()->create(['tarif' => 22500]);

    $this->postJson('/api/reservations', ['creneauId' => $creneau->id])
        ->assertJson(['montant' => 22500]);
});

// TC-010-03 : conflit — un créneau déjà réservé/verrouillé ne peut pas être réservé deux fois.
// C'est exactement le scénario que `lockForUpdate()` empêche en cas de vraie concurrence ; ici,
// deux requêtes séquentielles vérifient le même comportement observable.
test('refuse de réserver un créneau déjà verrouillé', function () {
    $creneau = Creneau::factory()->create(['statut' => 'disponible']);
    Sanctum::actingAs(User::factory()->create());
    $this->postJson('/api/reservations', ['creneauId' => $creneau->id])->assertCreated();

    Sanctum::actingAs(User::factory()->create());
    $reponse = $this->postJson('/api/reservations', ['creneauId' => $creneau->id]);

    $reponse->assertStatus(409)->assertJson([
        'message' => 'Ce créneau vient peut-être d\'être réservé par quelqu\'un d\'autre. Réessaie.',
    ]);
});

test('refuse de réserver un créneau qui n\'existe pas', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/reservations', ['creneauId' => (string) Str::uuid()])
        ->assertStatus(422)
        ->assertJson(['message' => "Ce créneau n'existe pas ou plus."]);
});

test('refuse d\'initier une réservation sans authentification', function () {
    $creneau = Creneau::factory()->create();

    $this->postJson('/api/reservations', ['creneauId' => $creneau->id])->assertUnauthorized();
});

// TC-011-01 : lecture du statut — forme exacte attendue par fetchReservation.
test('affiche le statut d\'une réservation à son joueur', function () {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id]);
    Sanctum::actingAs($joueur);

    $this->getJson("/api/reservations/{$reservation->id}")
        ->assertOk()
        ->assertJson(['id' => $reservation->id, 'statut' => 'en_attente_paiement']);
});

test('refuse de consulter la réservation d\'un autre joueur', function () {
    $reservation = Reservation::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/reservations/{$reservation->id}")->assertForbidden();
});

// expireA = created_at + durée du verrou (config('reservation.duree_verrou_minutes'), 15 par défaut).
test('calcule expireA à partir de created_at et de la durée du verrou configurée', function () {
    $joueur = User::factory()->create();
    $creeLe = now()->subMinutes(5);
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'created_at' => $creeLe]);
    Sanctum::actingAs($joueur);

    $reponse = $this->getJson("/api/reservations/{$reservation->id}")->assertOk();

    $attendu = $creeLe->copy()->addMinutes(config('reservation.duree_verrou_minutes'));
    expect($reponse->json('expireA'))->toBe($attendu->toIso8601String());
});

// TC-011-02 : expiration paresseuse — constatée à la lecture, pas par une tâche planifiée
// (aucun scheduler dans ce dépôt, voir RafraichirStatutReservation).
test('annule automatiquement une réservation dont le verrou a expiré, à la lecture', function () {
    $joueur = User::factory()->create();
    $terrain = Terrain::factory()->create();
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'reserve']);
    $reservation = Reservation::factory()->create([
        'joueur_id' => $joueur->id,
        'creneau_id' => $creneau->id,
        'statut' => 'en_attente_paiement',
        'created_at' => now()->subMinutes(config('reservation.duree_verrou_minutes') + 1),
    ]);
    Sanctum::actingAs($joueur);

    $this->getJson("/api/reservations/{$reservation->id}")
        ->assertOk()
        ->assertJson(['statut' => 'annulee']);

    expect($creneau->fresh()->statut)->toBe('disponible');
});

test('ne touche pas une réservation encore dans la fenêtre du verrou', function () {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'statut' => 'en_attente_paiement']);
    Sanctum::actingAs($joueur);

    $this->getJson("/api/reservations/{$reservation->id}")
        ->assertOk()
        ->assertJson(['statut' => 'en_attente_paiement']);
});

// Une réservation déjà terminale (ex. confirmée par un futur module Paiement) ne doit jamais être
// ré-annulée par la vérification d'expiration, même après l'échéance du verrou.
test('ne touche pas une réservation déjà confirmée même après l\'échéance du verrou', function () {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create([
        'joueur_id' => $joueur->id,
        'statut' => 'confirmee',
        'created_at' => now()->subMinutes(config('reservation.duree_verrou_minutes') + 1),
    ]);
    Sanctum::actingAs($joueur);

    $this->getJson("/api/reservations/{$reservation->id}")
        ->assertOk()
        ->assertJson(['statut' => 'confirmee']);
});
