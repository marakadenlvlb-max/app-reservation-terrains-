<?php

namespace App\Http\Controllers\Api\Paiement;

use App\Actions\Paiement\TraiterWebhookPaiement;
use App\Http\Controllers\Controller;
use App\Http\Requests\Paiement\WebhookPaiementRequest;
use App\Http\Resources\Paiement\PaiementResource;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;

/**
 * RF-014 — Réception du webhook de confirmation asynchrone, un par opérateur
 * (`/api/paiements/webhook/{operateur}`). Pas de `auth:sanctum` : l'appelant est le serveur de
 * l'opérateur, authentifié par signature partagée (voir TraiterWebhookPaiement::
 * verifierSignature()), pas par une session/un jeton utilisateur.
 */
class WebhookPaiementController extends Controller
{
    public function handle(
        WebhookPaiementRequest $request,
        string $operateur,
        TraiterWebhookPaiement $action
    ): JsonResponse {
        abort_unless(
            $action->verifierSignature($operateur, $request->header('X-Webhook-Signature')),
            401,
            'Signature invalide.'
        );

        $paiement = Paiement::findOrFail($request->validated('paiementId'));

        abort_if($paiement->operateur !== $operateur, 422, "L'opérateur ne correspond pas à ce paiement.");

        $paiement = $action->handle($paiement, $request->validated('statut'));

        return (new PaiementResource($paiement))->response();
    }
}
