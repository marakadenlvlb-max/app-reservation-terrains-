<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité MESSAGE — architecture.md section 3 (ajoutée le 30 août 2026), RF-023. Pas de colonne
 * `destinataire_id` : l'autre partie d'une conversation se déduit de la réservation elle-même (le
 * joueur via `RESERVATION.joueur_id`, le propriétaire/gestionnaire via `TERRAIN.proprietaire_id`
 * du créneau réservé) — même principe que `HistoriqueReservation.autrePartie` (module Historique).
 * Pas de colonne `lu` non plus : RF-023 exige un échange de messages, pas un accusé de lecture par
 * message (contrairement à `NOTIFICATION.lue`, exigé explicitement par RF-020).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignUuid('auteur_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenu');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
