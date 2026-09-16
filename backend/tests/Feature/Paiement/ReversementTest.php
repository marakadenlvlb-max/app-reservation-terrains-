<?php

use App\Actions\Paiement\TraiterWebhookPaiement;
use App\Models\Creneau;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/**
 * @return array{proprietaire: User, paiement: Paiement}
 */
function creerPaiementValidePourProprietaire(?User $proprietaire = null, string $statut = 'valide'): array
{
    $proprietaire ??= User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id]);
    $reservation = Reservation::factory()->create(['creneau_id' => $creneau->id]);
    $paiement = Paiement::factory()->create([
        'reservation_id' => $reservation->id,
        'statut' => $statut,
        'date_paiement' => now(),
    ]);

    return ['proprietaire' => $proprietaire, 'paiement' => $paiement];
}

// TC-015-01 : contrat exact de Reversement (types.ts). Ce test crée le paiement directement via
// la factory (sans passer par TraiterWebhookPaiement) : commission/montantNet/dateReversement
// restent donc `null` et statutReversement replie sur 'en_attente' — le comportement de secours de
// ReversementResource, pas le chemin réel (voir le test dédié plus bas pour le calcul réel de la
// commission à la confirmation, RF-015 tranché le 9 septembre 2026).
test('liste les reversements du propriétaire connecté', function () {
    ['proprietaire' => $proprietaire, 'paiement' => $paiement] = creerPaiementValidePourProprietaire();
    Sanctum::actingAs($proprietaire);

    $reponse = $this->getJson('/api/reversements');

    $reponse->assertOk()->assertJsonCount(1)->assertJson([[
        'paiementId' => $paiement->id,
        'reservationId' => $paiement->reservation_id,
        'operateur' => $paiement->operateur,
        'montant' => (float) $paiement->montant,
        'commission' => null,
        'montantNet' => null,
        'statutReversement' => 'en_attente',
        'dateReversement' => null,
    ]])->assertJsonStructure([['datePaiement']]);
});

// TC-015-07 (rapport-qa.md) : chemin réel — un paiement confirmé via le webhook (RF-014) porte
// une commission réellement calculée (RF-015, tranché le 9 septembre 2026), mais un reversement
// encore 'en_attente' (cycle revu le 16 septembre 2026 — voir EffectuerReversementsTest.php pour
// le passage à 'effectue' une fois le créneau commencé).
test('affiche la commission réellement calculée, reversement en attente, pour un paiement confirmé', function () {
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id]);
    $reservation = Reservation::factory()->create(['creneau_id' => $creneau->id]);
    $paiement = Paiement::factory()->create(['reservation_id' => $reservation->id, 'statut' => 'en_attente', 'montant' => 20000]);

    app(TraiterWebhookPaiement::class)->handle($paiement, 'valide');
    Sanctum::actingAs($proprietaire);

    $this->getJson('/api/reversements')->assertOk()->assertJson([[
        'montant' => 20000.0,
        'commission' => 2000.0, // 10% de 20000
        'montantNet' => 18000.0,
        'statutReversement' => 'en_attente',
        'dateReversement' => null,
    ]]);
});

test('n\'affiche pas les paiements des terrains d\'un autre propriétaire', function () {
    creerPaiementValidePourProprietaire(); // un autre propriétaire
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/reversements')->assertOk()->assertJsonCount(0);
});

// Seul un paiement effectivement validé compte comme un reversement — pas une question de
// taux/cycle, juste : on ne reverse pas de l'argent jamais reçu.
test('n\'affiche pas les paiements encore en attente ou échoués', function () {
    $proprietaire = User::factory()->create();
    creerPaiementValidePourProprietaire($proprietaire, 'en_attente');
    creerPaiementValidePourProprietaire($proprietaire, 'echoue');
    Sanctum::actingAs($proprietaire);

    $this->getJson('/api/reversements')->assertOk()->assertJsonCount(0);
});

test('affiche un message vide plutôt qu\'une erreur quand il n\'y a encore aucun reversement', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/reversements')->assertOk()->assertExactJson([]);
});

test('refuse de consulter les reversements sans authentification', function () {
    $this->getJson('/api/reversements')->assertUnauthorized();
});
