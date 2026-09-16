<?php

namespace App\Actions\Paiement;

use App\Models\Paiement;

/**
 * RF-015 — marque "effectué" un reversement laissé `'en_attente'` par TraiterWebhookPaiement, une
 * fois que son créneau a commencé. Invoquée par la tâche planifiée `paiements:reverser-echus`
 * (voir routes/console.php et EffectuerReversementsEchusCommand), pas par une route API : ce
 * passage à "effectué" n'est déclenché par aucune action utilisateur, seulement par le temps qui
 * passe — même principe qu'EnvoyerRappelsCreneaux (module Notifications).
 *
 * Le seuil retenu (`creneau.debut` passé) est délibérément le même que celui qui fait déjà
 * échouer une annulation dans AnnulerReservation ("Le créneau a déjà commencé, cette réservation
 * ne peut plus être annulée.") : une fois ce point dépassé, plus aucune annulation ne peut créer
 * de double versement, donc reverser à cet instant précis élimine le risque par construction
 * plutôt que de devoir le rattraper après coup (décision du porteur de projet, 16 septembre 2026,
 * qui a remplacé le cycle "immédiat" du 9 septembre 2026 — voir config/paiement.php).
 *
 * Ne touche jamais un paiement `'rembourse'` (uniquement `'valide'`) : une réservation annulée
 * avant le début du créneau (le seul cas possible, AnnulerReservation) n'a jamais eu son
 * reversement marqué "effectué" entre-temps, donc rien à recouvrer pour elle.
 */
class EffectuerReversementsEchus
{
    public function handle(): int
    {
        $paiements = Paiement::where('statut', 'valide')
            ->where('statut_reversement', 'en_attente')
            ->whereHas('reservation.creneau', function ($query) {
                $query->where('debut', '<=', now());
            })
            ->get();

        foreach ($paiements as $paiement) {
            $paiement->update([
                'statut_reversement' => 'effectue',
                'date_reversement' => now(),
            ]);
        }

        return $paiements->count();
    }
}
