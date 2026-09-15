<?php

namespace App\Http\Controllers\Api\Reservation;

use App\Actions\Reservation\AnnulerReservation;
use App\Actions\Reservation\InitierReservation;
use App\Actions\Reservation\RafraichirStatutReservation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\InitierReservationRequest;
use App\Http\Resources\Reservation\ReservationResource;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RF-010/RF-014/RF-021 — Sélection/verrouillage d'un créneau, suivi de son statut, et annulation
 * (US-22). Contrat exact déjà attendu par packages/reservation-core/src/reservationApi.ts.
 */
class ReservationController extends Controller
{
    public function store(InitierReservationRequest $request, InitierReservation $action): ReservationResource
    {
        $reservation = $action->handle($request->user(), $request->validated('creneauId'));

        return new ReservationResource($reservation);
    }

    public function show(Request $request, Reservation $reservation, RafraichirStatutReservation $action): ReservationResource
    {
        abort_if($reservation->joueur_id !== $request->user()->id, 403);

        return new ReservationResource($action->handle($reservation));
    }

    // RF-021 — contrat exact de annulerReservation (reservationApi.ts) : pas de body, réponse
    // { rembourse, message } (AnnulationReponse). Pas de Form Request : aucune entrée à valider.
    public function annuler(Request $request, Reservation $reservation, AnnulerReservation $action): JsonResponse
    {
        return response()->json($action->handle($request->user(), $reservation));
    }
}
