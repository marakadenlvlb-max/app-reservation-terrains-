<?php

namespace App\Actions\Paiement;

use App\Actions\Reservation\RafraichirStatutReservation;
use App\Models\Paiement;
use App\Models\Parrainage;
use App\Models\Reservation;
use App\Models\User;
use App\Services\Paiement\PaymentGatewayResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

/**
 * RF-011/RF-012/RF-013 — Initiation du paiement d'une réservation verrouillée (US-10). Rafraîchit
 * d'abord le statut de la réservation (RafraichirStatutReservation, module Réservation) : si le
 * verrou a expiré entre-temps, la réservation devient 'annulee' et il n'y a plus rien à payer —
 * même logique d'expiration paresseuse que le polling (US-11), pas dupliquée ici.
 *
 * RF-025 (correction du 9 septembre 2026, US-26) : si le joueur qui paie a un parrainage 'valide'
 * non encore consommé EN TANT QUE PARRAIN (décision explicite du porteur de projet : l'avantage
 * profite au parrain, pas au filleul), la réduction associée est appliquée ici sur le montant
 * réellement facturé — `Paiement.montant` reflète donc ce qui est vraiment débité, pas
 * `Reservation.montant` (qui reste le tarif plein du créneau, inchangé). Consommée au plus une
 * fois : la ligne PARRAINAGE passe à 'utilise' dans la même transaction que la création du
 * paiement, pour ne jamais pouvoir servir deux fois.
 *
 * **Transparence (rapport-qa.md, point signalé le 9 septembre 2026)** : le montant réellement
 * facturé et le pourcentage de réduction appliqué (le cas échéant) sont renvoyés au frontend dans
 * la réponse (`montant`, `reductionParrainagePourcentage`) — jusqu'ici, `InitierPaiementResult` ne
 * portait que `{ paiementId, checkoutUrl }`, laissant un joueur parrain payer moins cher sans
 * jamais pouvoir le constater dans l'app.
 */
class InitierPaiement
{
    public function __construct(
        private readonly RafraichirStatutReservation $rafraichirStatut,
        private readonly PaymentGatewayResolver $gateways,
    ) {}

    public function handle(User $joueur, Reservation $reservation, string $operateur): array
    {
        if ($reservation->joueur_id !== $joueur->id) {
            throw new AuthorizationException("Cette réservation ne t'appartient pas.");
        }

        $reservation = $this->rafraichirStatut->handle($reservation);

        if ($reservation->statut !== 'en_attente_paiement') {
            abort(409, "Cette réservation n'est plus en attente de paiement.");
        }

        [$paiement, $reductionParrainagePourcentage] = DB::transaction(function () use ($reservation, $operateur, $joueur) {
            // FIFO : la plus ancienne récompense de parrainage non consommée est utilisée en
            // premier, plutôt que de laisser le joueur choisir laquelle — un seul avantage à la
            // fois de toute façon (une réduction par paiement).
            $parrainage = Parrainage::where('parrain_id', $joueur->id)->where('statut', 'valide')->oldest()->lockForUpdate()->first();

            $montant = $parrainage
                ? round((float) $reservation->montant * (1 - (float) $parrainage->reduction_pourcentage / 100), 2)
                : (float) $reservation->montant;

            $paiement = Paiement::create([
                'reservation_id' => $reservation->id,
                'operateur' => $operateur,
                'statut' => 'en_attente',
                'montant' => $montant,
            ]);

            if ($parrainage) {
                $parrainage->update(['statut' => 'utilise', 'paiement_id' => $paiement->id]);
            }

            return [$paiement, $parrainage?->reduction_pourcentage !== null ? (float) $parrainage->reduction_pourcentage : null];
        });

        $checkoutUrl = $this->gateways->pour($operateur)->initierPaiement($paiement);

        return [
            'paiementId' => $paiement->id,
            'checkoutUrl' => $checkoutUrl,
            'montant' => (float) $paiement->montant,
            'reductionParrainagePourcentage' => $reductionParrainagePourcentage,
        ];
    }
}
