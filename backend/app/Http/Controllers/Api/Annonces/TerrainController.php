<?php

namespace App\Http\Controllers\Api\Annonces;

use App\Actions\Annonces\ModifierAnnonce;
use App\Actions\Annonces\PublierAnnonce;
use App\Actions\Annonces\RetirerAnnonce;
use App\Actions\Annonces\TeleverserPhotoTerrain;
use App\Http\Controllers\Controller;
use App\Http\Requests\Annonces\TerrainRequest;
use App\Http\Requests\Annonces\UploadTerrainPhotoRequest;
use App\Http\Resources\Annonces\TerrainResource;
use App\Models\Terrain;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * RF-004/RF-005/RF-006 — Publication, consultation, modification et retrait d'une annonce.
 * Contrat exact déjà attendu par packages/annonces-core/src/terrainApi.ts. `fetchTerrain` est
 * documenté côté frontend comme le point d'entrée de l'écran d'édition (US-06) : les 3 endpoints
 * protégés (show/update/destroy) sont donc restreints au propriétaire de l'annonce, pas ouverts à
 * n'importe quel utilisateur connecté — la consultation publique d'une annonce (US-08) est un
 * endpoint distinct, hors périmètre de ce module.
 */
class TerrainController extends Controller
{
    public function store(TerrainRequest $request, PublierAnnonce $action): TerrainResource
    {
        $terrain = $action->handle($request->user(), $request->validated());

        return new TerrainResource($terrain);
    }

    public function show(Request $request, Terrain $terrain): TerrainResource
    {
        $this->assertProprietaire($terrain, $request);

        return new TerrainResource($terrain->load('paliers'));
    }

    public function update(TerrainRequest $request, Terrain $terrain, ModifierAnnonce $action): TerrainResource
    {
        $terrain = $action->handle($terrain, $request->user(), $request->validated());

        return new TerrainResource($terrain);
    }

    public function destroy(Request $request, Terrain $terrain, RetirerAnnonce $action): Response
    {
        $action->handle($terrain, $request->user());

        return response()->noContent();
    }

    public function uploadPhoto(
        UploadTerrainPhotoRequest $request,
        Terrain $terrain,
        TeleverserPhotoTerrain $action
    ): array {
        $url = $action->handle($terrain, $request->user(), $request->file('photo'));

        // Contrat exact de uploadTerrainPhoto (terrainApi.ts) : { photoUrl }, pas le terrain complet.
        return ['photoUrl' => $url];
    }

    private function assertProprietaire(Terrain $terrain, Request $request): void
    {
        if ($terrain->proprietaire_id !== $request->user()->id) {
            throw new AuthorizationException("Cette annonce ne t'appartient pas.");
        }
    }
}
