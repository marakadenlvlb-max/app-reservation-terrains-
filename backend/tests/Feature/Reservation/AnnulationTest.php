<?php

use App\Models\Creneau;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// Prépare une réservation confirmée + son paiement validé, sur un terrain dont la politique
// d'annulation (paliers) est fournie par le test — RF-021 (correction du 9 septembre 2026).
//
// @param  array<int, array{delaiMinutes: int, pourcentageRemboursement: float}>  $paliers
function reservationAvecPolitique(
    int $minutesAvantCreneau,
    array $paliers,
    float $montant = 20000,
    float $fraisPourcentage = 2
): Reservation {
    $joueur = User::factory()->create();
    $terrain = Terrain::factory()->create(['frais_annulation_pourcentage' => $fraisPourcentage]);
    foreach ($paliers as $palier) {
        $terrain->paliers()->create([
            'delai_minutes' => $palier['delaiMinutes'],
            'pourcentage_remboursement' => $palier['pourcentageRemboursement'],
        ]);
    }
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'debut' => now()->addMinutes($minutesAvantCreneau), 'statut' => 'reserve']);
    $reservation = Reservation::factory()->create([
        'joueur_id' => $joueur->id,
        'creneau_id' => $creneau->id,
        'statut' => 'confirmee',
        'montant' => $montant,
    ]);
    Paiement::factory()->create(['reservation_id' => $reservation->id, 'statut' => 'valide', 'montant' => $montant]);

    return $reservation;
}

// TC-022-01 : le palier applicable est celui du délai le plus long parmi ceux respectés.
test('rembourse selon le palier respecté par le délai d\'annulation', function () {
    $reservation = reservationAvecPolitique(
        minutesAvantCreneau: 2880, // 48h avant
        paliers: [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]],
        montant: 20000,
        fraisPourcentage: 2,
    );
    Sanctum::actingAs($reservation->joueur);

    $reponse = $this->postJson("/api/reservations/{$reservation->id}/annulation");

    $reponse->assertOk()->assertJson(['rembourse' => true]);
    expect($reponse->json('message'))->toContain('19600'); // 20000 * (1 - 2%)

    expect($reservation->fresh()->statut)->toBe('annulee');
    expect($reservation->fresh()->creneau->statut)->toBe('disponible');
    expect($reservation->paiements()->first()->statut)->toBe('rembourse');
});

// TC-022-02 : plusieurs paliers définis — celui retenu est le plus proche du moment de
// l'annulation parmi ceux dont le délai est respecté (pas automatiquement le plus généreux).
test('applique le palier le plus proche parmi ceux respectés quand plusieurs sont définis', function () {
    $reservation = reservationAvecPolitique(
        minutesAvantCreneau: 90,
        paliers: [
            ['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100], // non respecté (90 < 1440)
            ['delaiMinutes' => 60, 'pourcentageRemboursement' => 50],    // respecté (90 >= 60) — retenu
            ['delaiMinutes' => 0, 'pourcentageRemboursement' => 0],
        ],
        montant: 10000,
        fraisPourcentage: 0,
    );
    Sanctum::actingAs($reservation->joueur);

    $reponse = $this->postJson("/api/reservations/{$reservation->id}/annulation");

    $reponse->assertOk()->assertJson(['rembourse' => true]);
    expect($reponse->json('message'))->toContain('5000')->toContain('50%');
});

// TC-022-03 : aucun palier ne couvre un délai aussi court → aucun remboursement (pas d'erreur).
test('n\'annonce aucun remboursement quand aucun palier n\'est respecté', function () {
    $reservation = reservationAvecPolitique(
        minutesAvantCreneau: 10,
        paliers: [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]],
    );
    Sanctum::actingAs($reservation->joueur);

    $reponse = $this->postJson("/api/reservations/{$reservation->id}/annulation");

    $reponse->assertOk()->assertJson(['rembourse' => false]);
    expect($reservation->fresh()->statut)->toBe('annulee');
    expect($reservation->fresh()->creneau->statut)->toBe('disponible');
    // Le paiement reste 'valide' : la somme est acquise, donc reversée normalement au propriétaire
    // (ObtenirReversements ne filtre que sur 'valide') plutôt que marquée 'rembourse'.
    expect($reservation->paiements()->first()->statut)->toBe('valide');
});

// Un palier à 0% explicite se comporte comme "aucun palier respecté" côté paiement/message.
test('un palier à 0% explicite n\'annonce aucun remboursement', function () {
    $reservation = reservationAvecPolitique(
        minutesAvantCreneau: 10,
        paliers: [['delaiMinutes' => 0, 'pourcentageRemboursement' => 0]],
    );
    Sanctum::actingAs($reservation->joueur);

    $this->postJson("/api/reservations/{$reservation->id}/annulation")->assertJson(['rembourse' => false]);
    expect($reservation->paiements()->first()->statut)->toBe('valide');
});

// TC-022-04 : les frais de transaction du TERRAIN sont déduits quel que soit le palier appliqué.
test('déduit les frais de transaction propres au terrain du montant remboursé', function () {
    $reservation = reservationAvecPolitique(
        minutesAvantCreneau: 2000,
        paliers: [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]],
        montant: 10000,
        fraisPourcentage: 10,
    );
    Sanctum::actingAs($reservation->joueur);

    $reponse = $this->postJson("/api/reservations/{$reservation->id}/annulation");

    expect($reponse->json('message'))->toContain('9000'); // 10000 * (1 - 10%)
});

// TC-022-05 : seul le joueur propriétaire de la réservation peut l'annuler.
test('refuse d\'annuler la réservation d\'un autre joueur', function () {
    $reservation = reservationAvecPolitique(2880, [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]]);
    Sanctum::actingAs(User::factory()->create());

    $this->postJson("/api/reservations/{$reservation->id}/annulation")->assertForbidden();
});

// TC-022-06 : même condition que estReservationAnnulable() côté frontend — revérifiée côté serveur.
test('refuse d\'annuler une réservation qui n\'est pas confirmée', function () {
    $joueur = User::factory()->create();
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'statut' => 'en_attente_paiement']);
    Sanctum::actingAs($joueur);

    $this->postJson("/api/reservations/{$reservation->id}/annulation")
        ->assertStatus(409)
        ->assertJson(['message' => 'Seule une réservation confirmée peut être annulée.']);
});

test('refuse d\'annuler une réservation dont le créneau a déjà commencé', function () {
    $reservation = reservationAvecPolitique(-1, [['delaiMinutes' => 0, 'pourcentageRemboursement' => 100]]);
    Sanctum::actingAs($reservation->joueur);

    $this->postJson("/api/reservations/{$reservation->id}/annulation")->assertStatus(409);
});

test('refuse d\'annuler sans authentification', function () {
    $reservation = reservationAvecPolitique(2880, [['delaiMinutes' => 1440, 'pourcentageRemboursement' => 100]]);

    $this->postJson("/api/reservations/{$reservation->id}/annulation")->assertUnauthorized();
});

// Réservation confirmée sans paiement 'valide' retrouvable (cas dégradé) : l'annulation reste
// possible, simplement sans remboursement à déclencher.
test('annule sans erreur une réservation confirmée sans paiement validé retrouvable', function () {
    $joueur = User::factory()->create();
    $terrain = Terrain::factory()->create();
    $terrain->paliers()->create(['delai_minutes' => 1440, 'pourcentage_remboursement' => 100]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'debut' => now()->addHours(48)]);
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneau->id, 'statut' => 'confirmee']);
    Sanctum::actingAs($joueur);

    $this->postJson("/api/reservations/{$reservation->id}/annulation")
        ->assertOk()->assertJson(['rembourse' => false, 'message' => 'Réservation annulée.']);
});
