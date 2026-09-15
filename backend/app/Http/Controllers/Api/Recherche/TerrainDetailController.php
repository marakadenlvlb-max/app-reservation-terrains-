<?php

namespace App\Http\Controllers\Api\Recherche;

use App\Actions\Recherche\ObtenirDetailTerrain;
use App\Http\Controllers\Controller;
use App\Models\Terrain;
use Illuminate\Http\JsonResponse;

/**
 * RF-009 — détail public d'une annonce (US-08). Contrat exact déjà attendu par
 * packages/recherche-core/src/rechercheApi.ts (`fetchTerrainDetail`). Contrôleur distinct de
 * `Annonces\TerrainController::show` (restreint au propriétaire) : ici, n'importe qui peut
 * consulter une annonce, y compris sans être connecté — même principe de séparation que
 * `Paiement\WebhookPaiementController` vis-à-vis de `PaiementController`.
 */
class TerrainDetailController extends Controller
{
    public function show(Terrain $terrain, ObtenirDetailTerrain $action): JsonResponse
    {
        return response()->json($action->handle($terrain));
    }
}
