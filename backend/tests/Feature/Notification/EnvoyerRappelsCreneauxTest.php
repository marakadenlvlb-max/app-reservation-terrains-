<?php

use App\Actions\Notification\EnvoyerRappelsCreneaux;
use App\Models\Creneau;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Terrain;
use App\Models\User;

// TC-021-02 : RF-020, "rappeler au joueur son créneau à l'approche de l'horaire réservé" — dans
// la fenêtre configurée (config('notification.delai_rappel_heures'), 2h par défaut).
test('crée un rappel pour une réservation confirmée dont le créneau approche', function () {
    $joueur = User::factory()->create();
    $terrain = Terrain::factory()->create();
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'debut' => now()->addHour()]);
    $reservation = Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneau->id, 'statut' => 'confirmee']);

    $nombre = (new EnvoyerRappelsCreneaux)->handle();

    expect($nombre)->toBe(1);
    expect(Notification::where('destinataire_id', $joueur->id)->where('type', 'rappel_creneau')->where('reservation_id', $reservation->id)->exists())->toBeTrue();
});

test('ne rappelle pas un créneau trop lointain', function () {
    $creneau = Creneau::factory()->create(['debut' => now()->addHours(10)]);
    Reservation::factory()->create(['creneau_id' => $creneau->id, 'statut' => 'confirmee']);

    expect((new EnvoyerRappelsCreneaux)->handle())->toBe(0);
    expect(Notification::count())->toBe(0);
});

test('ne rappelle pas une réservation pas encore confirmée', function () {
    $creneau = Creneau::factory()->create(['debut' => now()->addHour()]);
    Reservation::factory()->create(['creneau_id' => $creneau->id, 'statut' => 'en_attente_paiement']);

    expect((new EnvoyerRappelsCreneaux)->handle())->toBe(0);
});

// Idempotence : la tâche planifiée peut tourner plusieurs fois avant l'échéance du créneau.
test('ne crée pas deux fois le même rappel', function () {
    $creneau = Creneau::factory()->create(['debut' => now()->addHour()]);
    $reservation = Reservation::factory()->create(['creneau_id' => $creneau->id, 'statut' => 'confirmee']);

    (new EnvoyerRappelsCreneaux)->handle();
    $nombreSecondPassage = (new EnvoyerRappelsCreneaux)->handle();

    expect($nombreSecondPassage)->toBe(0);
    expect(Notification::where('reservation_id', $reservation->id)->where('type', 'rappel_creneau')->count())->toBe(1);
});

// RF-020 : "rappeler AU JOUEUR" — contrairement à la confirmation, le propriétaire n'est pas notifié.
test('ne notifie que le joueur, pas le propriétaire', function () {
    $joueur = User::factory()->create();
    $proprietaire = User::factory()->create();
    $terrain = Terrain::factory()->create(['proprietaire_id' => $proprietaire->id]);
    $creneau = Creneau::factory()->create(['terrain_id' => $terrain->id, 'debut' => now()->addHour()]);
    Reservation::factory()->create(['joueur_id' => $joueur->id, 'creneau_id' => $creneau->id, 'statut' => 'confirmee']);

    (new EnvoyerRappelsCreneaux)->handle();

    expect(Notification::where('destinataire_id', $proprietaire->id)->exists())->toBeFalse();
});
