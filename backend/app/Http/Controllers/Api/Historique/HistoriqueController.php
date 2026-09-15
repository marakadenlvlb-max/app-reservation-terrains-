<?php

namespace App\Http\Controllers\Api\Historique;

use App\Actions\Historique\ObtenirHistorique;
use App\Http\Controllers\Controller;
use App\Http\Resources\Historique\HistoriqueReservationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * RF-018/RF-019 — Historique des réservations. Contrat exact déjà attendu par
 * packages/historique-core/src/historiqueApi.ts (`fetchHistorique`) : deux endpoints distincts,
 * pas un seul paramétré par rôle.
 */
class HistoriqueController extends Controller
{
    public function mesReservations(Request $request, ObtenirHistorique $action): AnonymousResourceCollection
    {
        return HistoriqueReservationResource::collection($action->handle($request->user(), 'joueur'));
    }

    public function recues(Request $request, ObtenirHistorique $action): AnonymousResourceCollection
    {
        return HistoriqueReservationResource::collection($action->handle($request->user(), 'proprietaire'));
    }
}
