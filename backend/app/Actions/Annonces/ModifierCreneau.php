<?php

namespace App\Actions\Annonces;

use App\Models\Creneau;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * RF-006 — Modification d'un créneau existant. L'autorisation passe par le terrain parent
 * (`creneau->terrain->proprietaire_id`) : CRENEAU n'a pas de propriétaire propre dans le modèle
 * de données, seul TERRAIN en a un.
 *
 * updateCreneau (creneauApi.ts) documente que "le backend reste seul juge d'un éventuel conflit
 * (ex. créneau déjà réservé)", et backlog.md (US-06) confirme la règle : un créneau `reserve` ne
 * peut plus être modifié — vérifié côté client (boutons désactivés) mais jamais encore appliqué
 * côté backend. Rien ne peut encore faire passer un créneau à `reserve` (RF-010, module
 * Réservation, pas implémenté), donc ce garde-fou reste pour l'instant mort en pratique — mais
 * c'est une règle déjà actée, pas une invention : elle est prête pour quand RF-010 existera.
 */
class ModifierCreneau
{
    /**
     * @param  array{debut: string, fin: string, tarif: float}  $payload
     */
    public function handle(Creneau $creneau, User $utilisateur, array $payload): Creneau
    {
        if ($creneau->terrain->proprietaire_id !== $utilisateur->id) {
            throw new AuthorizationException("Ce créneau ne t'appartient pas.");
        }

        if ($creneau->statut === 'reserve') {
            abort(409, 'Ce créneau est déjà réservé et ne peut plus être modifié.');
        }

        $creneau->update([
            'debut' => $payload['debut'],
            'fin' => $payload['fin'],
            'tarif' => $payload['tarif'],
        ]);

        return $creneau;
    }
}
