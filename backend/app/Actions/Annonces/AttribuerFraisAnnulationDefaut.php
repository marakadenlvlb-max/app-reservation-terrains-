<?php

namespace App\Actions\Annonces;

use App\Models\Notification;
use App\Models\Terrain;

/**
 * RF-021 (correction du 9 septembre 2026) — calcule et notifie le taux de frais de transaction
 * PAR DÉFAUT d'un terrain (`TERRAIN.frais_annulation_pourcentage`), utilisé uniquement quand le
 * propriétaire n'a pas saisi sa propre valeur. Deux responsabilités regroupées ici plutôt que
 * séparées : la règle « jamais de taux par défaut appliqué sans avertissement préalable »
 * n'existe que si le calcul et la notification restent toujours appelés ensemble.
 */
class AttribuerFraisAnnulationDefaut
{
    /**
     * Barème dégressif fourni explicitement par le porteur de projet (config/reservation.php) —
     * la STRUCTURE est une décision produit ferme, les VALEURS restent provisoires (voir le
     * commentaire du fichier de config).
     */
    public function calculer(int $nombreTerrainsProprietaire): float
    {
        foreach (config('reservation.bareme_frais_annulation_defaut') as $palier) {
            if ($palier['max_terrains'] === null || $nombreTerrainsProprietaire <= $palier['max_terrains']) {
                return (float) $palier['pourcentage'];
            }
        }

        // Filet de sécurité : la dernière ligne du barème a toujours max_terrains = null, donc
        // ce chemin ne devrait jamais s'exécuter en usage normal.
        return 0.0;
    }

    /**
     * Avertissement envoyé au propriétaire dès l'attribution du taux par défaut (pas à chaque
     * remboursement) — décision explicite : le taux s'applique ensuite normalement à tout
     * remboursement ultérieur sur ce terrain, sans revérification à chaque fois.
     */
    public function notifier(Terrain $terrain, float $pourcentage): void
    {
        Notification::create([
            'destinataire_id' => $terrain->proprietaire_id,
            'reservation_id' => null,
            'type' => 'frais_annulation_defaut_attribue',
            'titre' => "Frais d'annulation par défaut appliqués",
            'message' => "Le terrain « {$terrain->adresse} » se voit attribuer des frais de transaction par défaut de {$pourcentage}% sur les remboursements liés à une annulation, calculés selon le nombre de terrains que tu possèdes. Tu peux fixer ta propre valeur à tout moment depuis la gestion de ce terrain.",
            'lue' => false,
        ]);
    }
}
