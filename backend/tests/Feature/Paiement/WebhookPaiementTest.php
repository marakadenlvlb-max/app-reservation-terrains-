<?php

use App\Models\Creneau;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Support\Str;

// Secret de test — en environnement réel, ces valeurs viennent de PAIEMENT_WEBHOOK_SECRET_WAVE
// etc. (config/paiement.php), jamais commitées.
beforeEach(function () {
    config(['paiement.webhook_secrets.wave' => 'secret-de-test']);

    $this->joueur = User::factory()->create();
    $this->proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $this->proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'statut' => 'reserve']);
    $reservation = Reservation::factory()->create([
        'joueur_id' => $this->joueur->id,
        'creneau_id' => $creneau->id,
        'statut' => 'en_attente_paiement',
    ]);

    $this->paiement = Paiement::factory()->create([
        'reservation_id' => $reservation->id,
        'operateur' => 'wave',
        'statut' => 'en_attente',
    ]);
});

// TC-014-01 : RF-014, "confirmer automatiquement la réservation... dès que le paiement est validé".
test('confirme la réservation quand le webhook signale un paiement validé', function () {
    $paiement = $this->paiement;

    $reponse = $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'valide']);

    $reponse->assertOk()->assertJson(['statut' => 'valide']);
    expect($paiement->fresh()->statut)->toBe('valide');
    expect($paiement->reservation->fresh()->statut)->toBe('confirmee');
});

// RF-020 : "notifier le joueur ET le propriétaire/gestionnaire à la confirmation d'une réservation".
test('notifie le joueur et le propriétaire quand le paiement est validé', function () {
    $paiement = $this->paiement;

    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'valide'])
        ->assertOk();

    expect(Notification::where('destinataire_id', $this->joueur->id)->where('type', 'confirmation_reservation')->count())->toBe(1);
    expect(Notification::where('destinataire_id', $this->proprietaire->id)->where('type', 'confirmation_reservation')->count())->toBe(1);
});

// TC-015-07 (rapport-qa.md) : RF-015, commission et cycle de reversement tranchés le 9 septembre
// 2026 (config('paiement.commission_pourcentage'), cycle immédiat dès confirmation).
test('calcule la commission et marque le reversement comme effectué dès la confirmation', function () {
    $paiement = $this->paiement;
    $paiement->update(['montant' => 10000]);

    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'valide'])
        ->assertOk();

    $frais = $paiement->fresh();
    expect((float) $frais->commission)->toBe(1000.0); // 10% de 10000
    expect((float) $frais->montant_net)->toBe(9000.0);
    expect($frais->statut_reversement)->toBe('effectue');
    expect($frais->date_reversement)->not->toBeNull();
});

test('ne calcule aucune commission quand le paiement échoue', function () {
    $paiement = $this->paiement;

    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'echoue'])
        ->assertOk();

    $frais = $paiement->fresh();
    expect($frais->commission)->toBeNull();
    expect($frais->statut_reversement)->toBeNull();
});

test('ne notifie personne quand le paiement échoue', function () {
    $paiement = $this->paiement;

    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'echoue'])
        ->assertOk();

    expect(Notification::count())->toBe(0);
});

// TC-014-02 : RF-014, "en cas d'échec de paiement, le créneau doit redevenir disponible".
test('annule la réservation et libère le créneau quand le webhook signale un échec', function () {
    $paiement = $this->paiement;

    $reponse = $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'echoue']);

    $reponse->assertOk()->assertJson(['statut' => 'echoue']);
    expect($paiement->fresh()->statut)->toBe('echoue');
    expect($paiement->reservation->fresh()->statut)->toBe('annulee');
    expect($paiement->reservation->creneau->fresh()->statut)->toBe('disponible');
});

test('refuse un webhook sans signature valide', function () {
    $paiement = $this->paiement;

    $this->withHeader('X-Webhook-Signature', 'mauvais-secret')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'valide'])
        ->assertUnauthorized();

    expect($paiement->fresh()->statut)->toBe('en_attente');
});

test('refuse un webhook sans en-tête de signature du tout', function () {
    $paiement = $this->paiement;

    $this->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'valide'])
        ->assertUnauthorized();
});

test('refuse un webhook dont l\'opérateur ne correspond pas au paiement', function () {
    $paiement = $this->paiement; // operateur = 'wave'
    config(['paiement.webhook_secrets.orange_money' => 'secret-de-test']);

    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/orange_money', ['paiementId' => $paiement->id, 'statut' => 'valide'])
        ->assertStatus(422);

    expect($paiement->fresh()->statut)->toBe('en_attente');
});

test('refuse un paiementId inconnu', function () {
    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => (string) Str::uuid(), 'statut' => 'valide'])
        ->assertStatus(422);
});

// Idempotence : un opérateur réel peut renvoyer le même webhook plusieurs fois.
test('ignore un webhook déjà traité plutôt que de le retraiter', function () {
    $paiement = $this->paiement;

    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'valide'])
        ->assertOk();

    // Un second appel, même avec un statut différent, ne doit rien changer une fois déjà traité.
    $this->withHeader('X-Webhook-Signature', 'secret-de-test')
        ->postJson('/api/paiements/webhook/wave', ['paiementId' => $paiement->id, 'statut' => 'echoue'])
        ->assertOk();

    expect($paiement->fresh()->statut)->toBe('valide');
    expect($paiement->reservation->fresh()->statut)->toBe('confirmee');
});
