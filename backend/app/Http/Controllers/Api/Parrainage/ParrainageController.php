<?php

namespace App\Http\Controllers\Api\Parrainage;

use App\Actions\Parrainage\ObtenirParrainageResume;
use App\Actions\Parrainage\UtiliserCodeParrainage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Parrainage\UtiliserCodeParrainageRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * RF-025 — contrat exact déjà attendu par packages/parrainage-core/src/parrainageApi.ts.
 */
class ParrainageController extends Controller
{
    public function show(Request $request, ObtenirParrainageResume $action): JsonResponse
    {
        return response()->json($action->handle($request->user()));
    }

    public function utiliser(UtiliserCodeParrainageRequest $request, UtiliserCodeParrainage $action): Response
    {
        $action->handle($request->user(), $request->validated('code'));

        // utiliserCodeParrainage (parrainageApi.ts) n'attend aucun corps de réponse, juste `ok`.
        return response()->noContent();
    }
}
