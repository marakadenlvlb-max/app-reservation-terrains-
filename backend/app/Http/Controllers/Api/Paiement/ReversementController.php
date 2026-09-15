<?php

namespace App\Http\Controllers\Api\Paiement;

use App\Actions\Paiement\ObtenirReversements;
use App\Http\Controllers\Controller;
use App\Http\Resources\Paiement\ReversementResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * RF-015 — Liste des reversements du propriétaire/gestionnaire connecté. Contrat exact déjà
 * attendu par packages/paiement-core/src/paiementApi.ts (`fetchReversements`).
 */
class ReversementController extends Controller
{
    public function index(Request $request, ObtenirReversements $action): AnonymousResourceCollection
    {
        return ReversementResource::collection($action->handle($request->user()));
    }
}
