<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité RESERVATION — architecture.md section 3, RF-010/RF-014. Pas de colonne `expire_a` :
 * packages/reservation-core/src/types.ts documente explicitement que ce champ est une hypothèse
 * frontend, calculée à la volée par le backend (`created_at` + durée de verrou, voir
 * config/reservation.php) plutôt que stockée — voir Reservation::expireA() sur le modèle.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('creneau_id')->constrained('creneaux')->cascadeOnDelete();
            $table->foreignUuid('joueur_id')->constrained('users')->cascadeOnDelete();
            $table->string('statut')->default('en_attente_paiement');
            $table->decimal('montant', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
