<?php

namespace App\Http\Controllers\Api\Notation;

use App\Actions\Notation\CreerNotation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notation\CreateNotationRequest;
use App\Http\Resources\Notation\NotationResource;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * RF-016 — Notation post-session. Contrat exact déjà attendu par
 * packages/notation-core/src/notationApi.ts (`creerNotation`).
 */
class NotationController extends Controller
{
    public function store(CreateNotationRequest $request, CreerNotation $action): JsonResponse
    {
        $reservation = Reservation::findOrFail($request->validated('reservationId'));
        $cible = User::findOrFail($request->validated('cibleId'));

        $notation = $action->handle($request->user(), $reservation, $cible, $request->validated());

        return (new NotationResource($notation))->response()->setStatusCode(201);
    }
}
