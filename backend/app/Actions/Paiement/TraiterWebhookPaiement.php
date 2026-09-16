<?php

namespace App\Actions\Paiement;

use App\Actions\Notification\CreerNotificationsConfirmation;
use App\Models\Paiement;
use Illuminate\Support\Facades\DB;

/**
 * RF-014 — Confirmation automatique de la réservation dès que le paiement est validé par
 * l'opérateur ("Le système doit confirmer automatiquement la réservation et libérer le verrou
 * temporaire du créneau... dès que le paiement est validé... en cas d'échec de paiement, le
 * créneau doit redevenir disponible", RF-014). C'est le webhook qui ferme la boucle laissée
 * ouverte par le module Réservation (US-10/US-11) : rien côté frontend ne peut jamais déclarer un
 * paiement réussi lui-même (types.ts, `InitierPaiementResult`).
 *
 * Idempotent par construction : un paiement déjà traité (`statut !== 'en_attente'`) n'est jamais
 * retraité — les opérateurs de paiement réels renvoient couramment le même webhook plusieurs fois
 * (retries en cas de non-réponse rapide), pas une garantie mais une pratique courante à anticiper.
 *
 * RF-015 (correction du 9 septembre 2026, cycle revu le 16 septembre 2026) — reversement au
 * propriétaire/gestionnaire : commission calculée ici (c'est le seul moment où le backend sait
 * qu'un paiement vient réellement d'être validé), mais **plus marquée "effectué" immédiatement**.
 * Le cycle "immédiat" du 9 septembre créait un risque de double versement : une annulation
 * remboursée (RF-021, AnnulerReservation) après un reversement déjà "effectué" laissait le
 * propriétaire garder l'argent pendant que le joueur était remboursé, sans mécanisme de
 * recouvrement. Décision du porteur de projet (16 septembre 2026, argent réel en jeu) : le
 * reversement reste `'en_attente'` ici et n'est marqué `'effectue'` que par
 * `EffectuerReversementsEchus` (tâche planifiée `paiements:reverser-echus`), une fois le créneau
 * commencé — le seuil exact où `AnnulerReservation` refuse déjà toute annulation, donc le risque
 * est éliminé par construction plutôt que rattrapé après coup. Voir config/paiement.php.
 */
class TraiterWebhookPaiement
{
    public function __construct(private readonly CreerNotificationsConfirmation $creerNotifications) {}

    public function handle(Paiement $paiement, string $statut): Paiement
    {
        if ($paiement->statut !== 'en_attente') {
            return $paiement;
        }

        DB::transaction(function () use ($paiement, $statut) {
            $paiement->update([
                'statut' => $statut,
                'date_paiement' => now(),
            ]);

            if ($statut === 'valide') {
                $paiement->reservation->update(['statut' => 'confirmee']);
                // RF-020 : notifier le joueur ET le propriétaire à la confirmation — c'est ici,
                // pas ailleurs, que le backend sait qu'une confirmation vient d'avoir lieu.
                $this->creerNotifications->handle($paiement->reservation);

                // RF-015 : commission calculée sur le montant RÉELLEMENT facturé (déjà net d'une
                // éventuelle réduction de parrainage, voir InitierPaiement) — pas sur le tarif
                // plein de la réservation, qui peut différer.
                $commissionPourcentage = (float) config('paiement.commission_pourcentage');
                $commission = round((float) $paiement->montant * ($commissionPourcentage / 100), 2);

                $paiement->update([
                    'commission' => $commission,
                    'montant_net' => round((float) $paiement->montant - $commission, 2),
                    // Plus 'effectue'/now() ici — voir EffectuerReversementsEchus, qui referme la
                    // boucle une fois le créneau commencé (annulation structurellement impossible).
                    'statut_reversement' => 'en_attente',
                ]);
            } else {
                // RF-014 : "en cas d'échec de paiement, le créneau doit redevenir disponible."
                $paiement->reservation->update(['statut' => 'annulee']);
                $paiement->reservation->creneau->update(['statut' => 'disponible']);
            }
        });

        return $paiement->fresh();
    }

    /**
     * Vérification par secret partagé — placeholder documenté dans WebhookPaiementRequest, pas
     * le mécanisme réel de signature de chaque opérateur (inconnu ici, aucun accès à leur
     * documentation/sandbox). `hash_equals` plutôt qu'une comparaison directe : résistant aux
     * attaques par mesure de temps sur la comparaison de chaînes.
     */
    public function verifierSignature(string $operateur, ?string $signatureRecue): bool
    {
        $secretAttendu = config("paiement.webhook_secrets.{$operateur}");

        if (! $secretAttendu) {
            return false;
        }

        return hash_equals($secretAttendu, (string) $signatureRecue);
    }
}
