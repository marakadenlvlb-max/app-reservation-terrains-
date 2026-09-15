<?php

namespace App\Http\Controllers\Api\Messagerie;

use App\Actions\Messagerie\EnvoyerMessage;
use App\Actions\Messagerie\ObtenirMessages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Messagerie\EnvoyerMessageRequest;
use App\Http\Resources\Messagerie\MessageResource;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * RF-023 — conversation liée à une réservation. Contrat exact déjà attendu par
 * packages/messagerie-core/src/messagerieApi.ts.
 */
class MessagerieController extends Controller
{
    public function index(Request $request, Reservation $reservation, ObtenirMessages $action): AnonymousResourceCollection
    {
        $messages = $action->handle($request->user(), $reservation);

        return MessageResource::collection($messages);
    }

    public function store(EnvoyerMessageRequest $request, Reservation $reservation, EnvoyerMessage $action): MessageResource
    {
        $message = $action->handle($request->user(), $reservation, $request->validated('contenu'));

        return new MessageResource($message);
    }
}
