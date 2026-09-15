<?php

namespace App\Actions\Reservation;

use App\Models\Creneau;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * RF-010 — Sélection et verrouillage temporaire d'un créneau. `lockForUpdate()` dans une
 * transaction est ce qui rend le verrouillage réellement exclusif : sans lui, deux joueurs
 * pourraient lire `statut === 'disponible'` en même temps avant que l'un des deux n'écrive
 * 'reserve' (RF-010 — PostgreSQL a été choisi précisément pour cette garantie transactionnelle,
 * architecture.md section 1).
 */
class InitierReservation
{
    public function handle(User $joueur, string $creneauId): Reservation
    {
        return DB::transaction(function () use ($joueur, $creneauId) {
            $creneau = Creneau::where('id', $creneauId)->lockForUpdate()->firstOrFail();

            if ($creneau->statut !== 'disponible') {
                // Même message que le repli déjà écrit côté frontend (reservationApi.ts) : la
                // route ne fait qu'expliciter ce que le frontend suppose déjà comme cause la plus
                // probable d'un échec ici.
                abort(409, 'Ce créneau vient peut-être d\'être réservé par quelqu\'un d\'autre. Réessaie.');
            }

            $creneau->update(['statut' => 'reserve']);

            return Reservation::create([
                'creneau_id' => $creneau->id,
                'joueur_id' => $joueur->id,
                'statut' => 'en_attente_paiement',
                'montant' => $creneau->tarif,
            ]);
        });
    }
}
