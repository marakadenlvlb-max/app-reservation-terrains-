<?php

namespace App\Http\Controllers\Api\Notation;

use App\Actions\Notation\ObtenirNoteMoyenne;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * RF-017 — Note moyenne d'un utilisateur. Pas de `auth:sanctum` : fetchNoteMoyenne
 * (notationApi.ts) n'envoie volontairement aucun token, "visible par les autres utilisateurs
 * avant une réservation" (RF-017) y compris sans être connecté.
 */
class NoteMoyenneController extends Controller
{
    public function show(User $utilisateur, ObtenirNoteMoyenne $action): JsonResponse
    {
        return response()->json($action->handle($utilisateur));
    }
}
