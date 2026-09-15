<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

// TC-021-01 : contrat exact de enregistrerPushToken (notificationApi.ts).
test('enregistre le jeton push d\'un appareil', function () {
    $utilisateur = User::factory()->create(['push_tokens' => []]);
    Sanctum::actingAs($utilisateur);

    $this->postJson('/api/utilisateurs/moi/push-tokens', ['pushToken' => 'ExponentPushToken[xxxx]'])
        ->assertNoContent();

    expect($utilisateur->fresh()->push_tokens)->toBe(['ExponentPushToken[xxxx]']);
});

test('n\'ajoute pas deux fois le même jeton', function () {
    $utilisateur = User::factory()->create(['push_tokens' => ['ExponentPushToken[xxxx]']]);
    Sanctum::actingAs($utilisateur);

    $this->postJson('/api/utilisateurs/moi/push-tokens', ['pushToken' => 'ExponentPushToken[xxxx]'])
        ->assertNoContent();

    expect($utilisateur->fresh()->push_tokens)->toBe(['ExponentPushToken[xxxx]']);
});

test('accumule plusieurs jetons pour plusieurs appareils', function () {
    $utilisateur = User::factory()->create(['push_tokens' => ['jeton-1']]);
    Sanctum::actingAs($utilisateur);

    $this->postJson('/api/utilisateurs/moi/push-tokens', ['pushToken' => 'jeton-2'])->assertNoContent();

    expect($utilisateur->fresh()->push_tokens)->toBe(['jeton-1', 'jeton-2']);
});

test('refuse un enregistrement sans jeton', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/utilisateurs/moi/push-tokens', [])->assertStatus(422);
});

test('refuse d\'enregistrer un jeton sans authentification', function () {
    $this->postJson('/api/utilisateurs/moi/push-tokens', ['pushToken' => 'jeton'])->assertUnauthorized();
});
