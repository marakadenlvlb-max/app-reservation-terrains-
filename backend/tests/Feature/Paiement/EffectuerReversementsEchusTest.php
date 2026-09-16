<?php

use App\Actions\Paiement\EffectuerReversementsEchus;
use App\Models\Creneau;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Terrain;

/**
 * RF-015 (cycle revu le 16 septembre 2026) — voir EffectuerReversementsEchus pour le détail de la
 * décision (élimine le risque de double versement en reportant le reversement au moment où une
 * annulation devient structurellement impossible).
 */
function creerPaiementEnAttente(string $debutCreneau, string $statutPaiement = 'valide', string $statutReversement = 'en_attente'): Paiement
{
    $terrain = Terrain::factory()->create();
    $creneau = Creneau::factory()->create([
        'terrain_id' => $terrain->id,
        'debut' => $debutCreneau,
        'fin' => (new DateTime($debutCreneau))->modify('+1 hour'),
    ]);
    $reservation = Reservation::factory()->create(['creneau_id' => $creneau->id, 'statut' => 'confirmee']);

    return Paiement::factory()->create([
        'reservation_id' => $reservation->id,
        'statut' => $statutPaiement,
        'statut_reversement' => $statutReversement,
        'montant' => 15000,
        'commission' => 1500,
        'montant_net' => 13500,
    ]);
}

test('marque effectué un reversement en attente dont le créneau a commencé', function () {
    $paiement = creerPaiementEnAttente(now()->subHour()->toIso8601String());

    $nombre = app(EffectuerReversementsEchus::class)->handle();

    expect($nombre)->toBe(1);
    $frais = $paiement->fresh();
    expect($frais->statut_reversement)->toBe('effectue');
    expect($frais->date_reversement)->not->toBeNull();
});

test('ne touche pas un reversement en attente dont le créneau n\'a pas encore commencé', function () {
    $paiement = creerPaiementEnAttente(now()->addHour()->toIso8601String());

    $nombre = app(EffectuerReversementsEchus::class)->handle();

    expect($nombre)->toBe(0);
    expect($paiement->fresh()->statut_reversement)->toBe('en_attente');
    expect($paiement->fresh()->date_reversement)->toBeNull();
});

test('est idempotente : ne retraite pas un reversement déjà effectué', function () {
    $paiement = creerPaiementEnAttente(now()->subDay()->toIso8601String(), 'valide', 'effectue');
    $paiement->update(['date_reversement' => now()->subDay()]);
    $dateReversementInitiale = $paiement->fresh()->date_reversement;

    $nombre = app(EffectuerReversementsEchus::class)->handle();

    expect($nombre)->toBe(0);
    expect($paiement->fresh()->date_reversement->equalTo($dateReversementInitiale))->toBeTrue();
});

// Le cas central de la décision du 16 septembre 2026 : une réservation annulée et remboursée
// (AnnulerReservation, RF-021) passe son paiement à 'rembourse' — jamais 'valide' — donc ne doit
// JAMAIS être reversée au propriétaire, même si le créneau est déjà passé.
test('ne reverse jamais un paiement remboursé, même après le début du créneau', function () {
    $paiement = creerPaiementEnAttente(now()->subHour()->toIso8601String(), 'rembourse', 'en_attente');

    $nombre = app(EffectuerReversementsEchus::class)->handle();

    expect($nombre)->toBe(0);
    expect($paiement->fresh()->statut_reversement)->toBe('en_attente');
});

test('la commande artisan referme les reversements échus', function () {
    creerPaiementEnAttente(now()->subHour()->toIso8601String());
    creerPaiementEnAttente(now()->addHour()->toIso8601String());

    $this->artisan('paiements:reverser-echus')
        ->expectsOutputToContain('1 reversement(s) marqué(s) effectué(s).')
        ->assertExitCode(0);
});
