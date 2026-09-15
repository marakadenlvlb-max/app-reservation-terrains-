<?php

use App\Models\Notification;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// TC-020-01 : contrat exact de fetchNotifications (notificationApi.ts).
test('liste les notifications du destinataire connecté', function () {
    $utilisateur = User::factory()->create();
    $notification = Notification::factory()->create(['destinataire_id' => $utilisateur->id]);
    Sanctum::actingAs($utilisateur);

    $reponse = $this->getJson('/api/notifications');

    $reponse->assertOk()->assertJsonCount(1)->assertJson([[
        'id' => $notification->id,
        'type' => 'confirmation_reservation',
        'lue' => false,
    ]]);
});

test('n\'affiche pas les notifications d\'un autre utilisateur', function () {
    Notification::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/notifications')->assertOk()->assertJsonCount(0);
});

test('trie les notifications du plus récent au plus ancien', function () {
    $utilisateur = User::factory()->create();
    $ancienne = Notification::factory()->create(['destinataire_id' => $utilisateur->id, 'created_at' => now()->subDays(1)]);
    $recente = Notification::factory()->create(['destinataire_id' => $utilisateur->id, 'created_at' => now()]);
    Sanctum::actingAs($utilisateur);

    $reponse = $this->getJson('/api/notifications')->assertOk();

    expect($reponse->json('0.id'))->toBe($recente->id);
    expect($reponse->json('1.id'))->toBe($ancienne->id);
});

// TC-020-02 : contrat exact de marquerCommeLue (aucun corps de réponse attendu).
test('marque une notification comme lue', function () {
    $utilisateur = User::factory()->create();
    $notification = Notification::factory()->create(['destinataire_id' => $utilisateur->id, 'lue' => false]);
    Sanctum::actingAs($utilisateur);

    $this->patchJson("/api/notifications/{$notification->id}/lue")->assertNoContent();

    expect($notification->fresh()->lue)->toBeTrue();
});

test('refuse de marquer comme lue la notification d\'un autre utilisateur', function () {
    $notification = Notification::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson("/api/notifications/{$notification->id}/lue")->assertForbidden();
    expect($notification->fresh()->lue)->toBeFalse();
});

test('refuse de consulter les notifications sans authentification', function () {
    $this->getJson('/api/notifications')->assertUnauthorized();
});

test('refuse de marquer comme lue sans authentification', function () {
    $notification = Notification::factory()->create();

    $this->patchJson("/api/notifications/{$notification->id}/lue")->assertUnauthorized();
});
