<?php

use App\Models\Creneau;
use App\Models\Paiement;
use App\Models\Parrainage;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

// TC-012/013/014-01 : contrat exact de initierPaiement (paiementApi.ts), paramétré sur les trois
// opérateurs Must have (RF-011/012/013) — un seul endpoint générique, comme côté frontend
// (PaiementOperateurBouton).
test('initie un paiement pour chaque opérateur', function (string $operateur) {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'montant' => 15000]);
    Sanctum::actingAs($joueur);

    $reponse = $this->postJson('/api/paiements', [
        'reservationId' => $reservation->id,
        'operateur' => $operateur,
    ]);

    $reponse->assertCreated()->assertJsonStructure(['paiementId', 'checkoutUrl', 'montant', 'reductionParrainagePourcentage']);
    expect($reponse->json('checkoutUrl'))->toContain($operateur);
    // Transparence (rapport-qa.md, 9 septembre 2026) : sans parrainage, `montant` reflète le
    // tarif plein et `reductionParrainagePourcentage` est explicitement `null`, pas absent.
    // (float) sur la valeur décodée : PHP's json_encode d'un float à valeur entière (15000.0)
    // omet le ".0" ("15000"), redevenant un int au décodage — piège déjà connu ailleurs dans ce
    // projet, jamais comparé directement à un littéral float sans recast.
    expect((float) $reponse->json('montant'))->toBe(15000.0);
    expect($reponse->json('reductionParrainagePourcentage'))->toBeNull();

    $paiement = Paiement::find($reponse->json('paiementId'));
    expect($paiement->reservation_id)->toBe($reservation->id);
    expect($paiement->operateur)->toBe($operateur);
    expect((float) $paiement->montant)->toBe(15000.0);
    expect($paiement->statut)->toBe('en_attente');
})->with(['wave', 'orange_money', 'moov_money']);

test('refuse un opérateur inconnu', function () {
    Sanctum::actingAs(User::factory()->create());
    $reservation = Reservation::factory()->create();

    $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'carte_bancaire'])
        ->assertStatus(422);
});

test('refuse une réservation qui n\'existe pas', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/paiements', ['reservationId' => (string) Str::uuid(), 'operateur' => 'wave'])
        ->assertStatus(422)
        ->assertJson(['message' => "Cette réservation n'existe pas."]);
});

test('refuse d\'initier un paiement sans authentification', function () {
    $reservation = Reservation::factory()->create();

    $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'wave'])
        ->assertUnauthorized();
});

test('refuse de payer la réservation d\'un autre joueur', function () {
    $reservation = Reservation::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'wave'])
        ->assertForbidden();
});

test('refuse de payer une réservation déjà confirmée', function () {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'statut' => 'confirmee']);
    Sanctum::actingAs($joueur);

    $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'wave'])
        ->assertStatus(409)
        ->assertJson(['message' => "Cette réservation n'est plus en attente de paiement."]);
});

// Le verrou expiré doit être rafraîchi (RafraichirStatutReservation) avant de tenter le paiement
// — pas de paiement possible sur une réservation dont le créneau a été relâché entre-temps.
test('refuse de payer une réservation dont le verrou a expiré', function () {
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

    $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'wave'])
        ->assertStatus(409);

    expect($reservation->fresh()->statut)->toBe('annulee');
    expect($creneau->fresh()->statut)->toBe('disponible');
});

// TC-026-01 : RF-025 (correction du 9 septembre 2026) — un parrainage 'valide' non consommé
// réduit le montant réellement facturé au PARRAIN (pas au filleul, décision explicite).
test('applique la réduction de parrainage du parrain sur son paiement', function () {
    $parrain = User::factory()->create();
    $parrainage = Parrainage::factory()->create(['parrain_id' => $parrain->id, 'statut' => 'valide', 'reduction_pourcentage' => 10]);
    $reservation = Reservation::factory()->create(['joueur_id' => $parrain->id, 'montant' => 10000]);
    Sanctum::actingAs($parrain);

    $reponse = $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'wave']);

    // Transparence (rapport-qa.md, 9 septembre 2026) : le parrain doit pouvoir constater dans
    // l'app qu'une réduction a bien été appliquée, pas seulement en base.
    $reponse->assertJson(['montant' => 9000.0, 'reductionParrainagePourcentage' => 10.0]);

    $paiement = Paiement::find($reponse->json('paiementId'));
    expect((float) $paiement->montant)->toBe(9000.0);
    expect($parrainage->fresh()->statut)->toBe('utilise');
    expect($parrainage->fresh()->paiement_id)->toBe($paiement->id);
});

test('ne consomme pas deux fois la même réduction de parrainage', function () {
    $parrain = User::factory()->create();
    Parrainage::factory()->create(['parrain_id' => $parrain->id, 'statut' => 'valide']);
    $premiereReservation = Reservation::factory()->create(['joueur_id' => $parrain->id, 'montant' => 10000]);
    $secondeReservation = Reservation::factory()->create(['joueur_id' => $parrain->id, 'montant' => 10000]);
    Sanctum::actingAs($parrain);

    $this->postJson('/api/paiements', ['reservationId' => $premiereReservation->id, 'operateur' => 'wave']);
    $reponse = $this->postJson('/api/paiements', ['reservationId' => $secondeReservation->id, 'operateur' => 'wave']);

    $paiement = Paiement::find($reponse->json('paiementId'));
    expect((float) $paiement->montant)->toBe(10000.0);
});

test('ne réduit rien sans parrainage valide en attente', function () {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'montant' => 10000]);
    Sanctum::actingAs($joueur);

    $reponse = $this->postJson('/api/paiements', ['reservationId' => $reservation->id, 'operateur' => 'wave']);

    expect((float) Paiement::find($reponse->json('paiementId'))->montant)->toBe(10000.0);
});
