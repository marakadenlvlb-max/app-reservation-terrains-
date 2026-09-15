<?php

namespace App\Http\Controllers\Api\Notification;

use App\Actions\Notification\EnregistrerPushToken;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\EnregistrerPushTokenRequest;
use Illuminate\Http\Response;

/**
 * RF-020 — Enregistrement du jeton push d'un appareil. Contrat exact déjà attendu par
 * packages/notification-core/src/notificationApi.ts (`enregistrerPushToken`) : vit dans ce même
 * module (pas Authentification) puisqu'il ne sert qu'à la livraison des notifications, même si
 * l'URL (`/api/utilisateurs/moi/push-tokens`) évoque le module Utilisateur.
 */
class PushTokenController extends Controller
{
    public function store(EnregistrerPushTokenRequest $request, EnregistrerPushToken $action): Response
    {
        $action->handle($request->user(), $request->validated('pushToken'));

        return response()->noContent();
    }
}
