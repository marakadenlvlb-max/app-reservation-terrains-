<?php

namespace App\Actions\Reservation;

use App\Models\PalierAnnulation;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

/**
 * RF-021/US-22 — Annulation d'une réservation confirmée par le joueur. Depuis la correction du
 * 9 septembre 2026, la politique de délai n'est plus un seuil unique décidé par l'application :
 * chaque terrain définit ses propres paliers (délai avant le créneau → % remboursé, voir
 * Terrain::paliers()), et déduit ses propres frais de transaction
 * (`TERRAIN.frais_annulation_pourcentage`) du montant remboursé quel que soit le palier retenu.
 */
class AnnulerReservation
{
    public function handle(User $joueur, Reservation $reservation): array
    {
        if ($reservation->joueur_id !== $joueur->id) {
            throw new AuthorizationException("Cette réservation ne t'appartient pas.");
        }

        // Même condition que estReservationAnnulable() côté frontend (historique-core) — revérifiée
        // ici côté serveur plutôt que de faire confiance à la vérification client.
        if ($reservation->statut !== 'confirmee') {
            abort(409, "Seule une réservation confirmée peut être annulée.");
        }

        if ($reservation->creneau->debut->isPast()) {
            abort(409, 'Le créneau a déjà commencé, cette réservation ne peut plus être annulée.');
        }

        $terrain = $reservation->creneau->terrain;

        // Calcul par timestamps plutôt que Carbon::diffInHours($other, false) : sa convention de
        // signe prête à confusion et a été vérifiée à l'envers en écrivant le test du seuil exact
        // de l'ancienne version à délai unique — un décompte de minutes n'a pas ce piège.
        $minutesAvantCreneau = ($reservation->creneau->debut->getTimestamp() - now()->getTimestamp()) / 60;

        $palier = $terrain->paliers // déjà trié par delai_minutes décroissant (Terrain::paliers())
            ->first(fn (PalierAnnulation $p) => $minutesAvantCreneau >= $p->delai_minutes);

        // Aucun palier respecté (annulation plus tardive que le plus court délai configuré par le
        // propriétaire) : aucune règle du terrain ne couvre ce cas, donc aucun remboursement — le
        // même filet de sécurité que le palier le plus strict de l'exemple donné par le porteur de
        // projet ("après 21h30 → 0%").
        $pourcentageRembourse = $palier ? (float) $palier->pourcentage_remboursement : 0.0;

        // 'valide' : seul un paiement confirmé (RF-013/RF-014) peut donner lieu à un remboursement ;
        // whereHas côté ObtenirReversements filtre déjà sur ce même statut, donc le repasser à
        // 'rembourse' ici l'exclut naturellement d'un futur reversement au propriétaire.
        $paiement = $reservation->paiements()->where('statut', 'valide')->latest()->first();

        $rembourse = false;
        $message = 'Réservation annulée.';

        DB::transaction(function () use ($reservation, $terrain, $pourcentageRembourse, $paiement, &$rembourse, &$message) {
            $reservation->update(['statut' => 'annulee']);
            $reservation->creneau->update(['statut' => 'disponible']);

            if (! $paiement) {
                // Réservation confirmée sans paiement 'valide' trouvé : ne devrait pas arriver en
                // usage normal (RF-014 confirme via webhook), mais rien à rembourser dans ce cas.
                return;
            }

            if ($pourcentageRembourse <= 0) {
                $message = "Aucun remboursement : le palier applicable de ce terrain prévoit 0% à ce délai.";

                return;
            }

            $montantBrut = (float) $paiement->montant * ($pourcentageRembourse / 100);
            $fraisPourcentage = (float) $terrain->frais_annulation_pourcentage;
            $montantNet = round($montantBrut * (1 - $fraisPourcentage / 100), 2);

            $paiement->update(['statut' => 'rembourse']);
            $rembourse = true;
            $message = "Remboursement de {$montantNet} FCFA en cours ({$pourcentageRembourse}% du montant, frais de transaction de {$fraisPourcentage}% déduits).";
        });

        return ['rembourse' => $rembourse, 'message' => $message];
    }
}
