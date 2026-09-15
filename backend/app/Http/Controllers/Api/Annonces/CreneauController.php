<?php

namespace App\Http\Controllers\Api\Annonces;

use App\Actions\Annonces\CreerCreneau;
use App\Actions\Annonces\ModifierCreneau;
use App\Actions\Annonces\RetirerCreneau;
use App\Http\Controllers\Controller;
use App\Http\Requests\Annonces\CreneauRequest;
use App\Http\Resources\Annonces\CreneauResource;
use App\Models\Creneau;
use App\Models\Terrain;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * RF-006 — Créneaux et tarifs d'un terrain. Contrat exact déjà attendu par
 * packages/annonces-core/src/creneauApi.ts. `index`/`store` sont imbriqués sous le terrain
 * (`/api/terrains/{terrain}/creneaux`) ; `update`/`destroy` ciblent directement le créneau
 * (`/api/creneaux/{creneau}`) — pas de route imbriquée pour ces deux-là, cohérent avec les URLs
 * déjà appelées côté frontend (updateCreneau/deleteCreneau n'ont pas besoin du terrainId).
 */
class CreneauController extends Controller
{
    public function index(Request $request, Terrain $terrain): AnonymousResourceCollection
    {
        $this->assertProprietaire($terrain, $request);

        return CreneauResource::collection($terrain->creneaux);
    }

    public function store(CreneauRequest $request, Terrain $terrain, CreerCreneau $action): CreneauResource
    {
        $creneau = $action->handle($terrain, $request->user(), $request->validated());

        return new CreneauResource($creneau);
    }

    public function update(CreneauRequest $request, Creneau $creneau, ModifierCreneau $action): CreneauResource
    {
        $creneau = $action->handle($creneau, $request->user(), $request->validated());

        return new CreneauResource($creneau);
    }

    public function destroy(Request $request, Creneau $creneau, RetirerCreneau $action): Response
    {
        $action->handle($creneau, $request->user());

        return response()->noContent();
    }

    private function assertProprietaire(Terrain $terrain, Request $request): void
    {
        if ($terrain->proprietaire_id !== $request->user()->id) {
            throw new AuthorizationException("Cette annonce ne t'appartient pas.");
        }
    }
}
