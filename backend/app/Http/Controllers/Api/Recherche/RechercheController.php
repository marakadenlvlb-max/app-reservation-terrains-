<?php

namespace App\Http\Controllers\Api\Recherche;

use App\Actions\Recherche\RechercherTerrains;
use App\Http\Controllers\Controller;
use App\Http\Requests\Recherche\RechercheTerrainsRequest;
use Illuminate\Http\JsonResponse;

/**
 * RF-007/RF-008/RF-022 — recherche publique de créneaux disponibles. Contrat exact déjà attendu
 * par packages/recherche-core/src/rechercheApi.ts (`searchTerrains`). Pas de `auth:sanctum` : un
 * visiteur non connecté doit pouvoir parcourir le catalogue avant même de créer un compte.
 */
class RechercheController extends Controller
{
    public function index(RechercheTerrainsRequest $request, RechercherTerrains $action): JsonResponse
    {
        return response()->json($action->handle($request->validated()));
    }
}
