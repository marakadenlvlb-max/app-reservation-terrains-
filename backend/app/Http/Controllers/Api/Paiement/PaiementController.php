<?php

namespace App\Http\Controllers\Api\Paiement;

use App\Actions\Paiement\InitierPaiement;
use App\Http\Controllers\Controller;
use App\Http\Requests\Paiement\InitierPaiementRequest;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;

/**
 * RF-011/RF-012/RF-013 — Initiation d'un paiement. Contrat exact déjà attendu par
 * packages/paiement-core/src/paiementApi.ts (`initierPaiement`). Le reversement (US-15/RF-015,
 * consultation en lecture seule) est géré par ReversementController, un contrôleur distinct.
 */
class PaiementController extends Controller
{
    public function store(InitierPaiementRequest $request, InitierPaiement $action): JsonResponse
    {
        $reservation = Reservation::findOrFail($request->validated('reservationId'));

        $resultat = $action->handle($request->user(), $reservation, $request->validated('operateur'));

        return response()->json($resultat, 201);
    }
}
