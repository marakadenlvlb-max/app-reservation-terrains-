<?php

namespace App\Http\Controllers\Api\Recommandation;

use App\Actions\Recommandation\ObtenirRecommandations;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RF-024 — recommandations personnelles. Contrat exact déjà attendu par
 * packages/recherche-core/src/recommandationApi.ts (`fetchRecommandations`). Exige `auth:sanctum`
 * (contrairement à la recherche/au détail d'annonce, publics) : la suggestion dépend de
 * l'historique personnel du joueur connecté.
 */
class RecommandationController extends Controller
{
    public function index(Request $request, ObtenirRecommandations $action): JsonResponse
    {
        return response()->json($action->handle($request->user()));
    }
}
