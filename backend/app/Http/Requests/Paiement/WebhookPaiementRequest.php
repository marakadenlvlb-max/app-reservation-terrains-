<?php

namespace App\Http\Requests\Paiement;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-014 — Webhook de confirmation asynchrone (architecture.md section 4 : "endpoint webhook
 * pour confirmation asynchrone"). Contrat PROVISOIRE : aucun opérateur réel ne peut être consulté
 * dans cet environnement (voir config/paiement.php) — cette forme ({ paiementId, statut }) est un
 * choix raisonnable, pas une garantie de correspondance avec le vrai payload Wave/Orange Money/
 * Moov Money, à confronter à leur documentation réelle avant mise en production.
 */
class WebhookPaiementRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        // La vérification d'authenticité de ce endpoint ne passe pas par Sanctum (l'appelant est
        // un serveur d'opérateur, pas un utilisateur de l'app) mais par la signature partagée —
        // voir TraiterWebhookPaiement::verifierSignature(), appelée par le contrôleur.
        return true;
    }

    public function rules(): array
    {
        return [
            'paiementId' => ['required', 'string', Rule::exists('paiements', 'id')],
            'statut' => ['required', 'string', Rule::in(['valide', 'echoue'])],
        ];
    }
}
