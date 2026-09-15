<?php

namespace App\Http\Controllers\Api\Notification;

use App\Actions\Notification\MarquerNotificationCommeLue;
use App\Actions\Notification\ObtenirNotifications;
use App\Http\Controllers\Controller;
use App\Http\Resources\Notification\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * RF-020 — Journal des notifications. Contrat exact déjà attendu par
 * packages/notification-core/src/notificationApi.ts.
 */
class NotificationController extends Controller
{
    public function index(Request $request, ObtenirNotifications $action): AnonymousResourceCollection
    {
        return NotificationResource::collection($action->handle($request->user()));
    }

    public function marquerCommeLue(
        Request $request,
        Notification $notification,
        MarquerNotificationCommeLue $action
    ): Response {
        $action->handle($notification, $request->user());

        // marquerCommeLue (notificationApi.ts) n'attend qu'un statut ok, aucun corps lu.
        return response()->noContent();
    }
}
