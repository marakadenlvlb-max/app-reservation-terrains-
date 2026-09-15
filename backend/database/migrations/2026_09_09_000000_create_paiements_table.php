<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité PAIEMENT — architecture.md section 3, colonnes reprises telles que documentées, y
 * compris `commission`/`montant_net`/`statut_reversement`/`date_reversement` (correction du
 * 30 août 2026 pour RF-015) : cette tâche (US-12/13/14, initiation + confirmation) ne les
 * renseigne pas elle-même, mais l'entité complète est créée ici pour que le module Reversement
 * (US-15, hors périmètre de cette tâche) n'ait pas de migration à revenir modifier plus tard.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->string('operateur');
            $table->string('statut')->default('en_attente');
            $table->decimal('montant', 10, 2);
            $table->string('reference_externe')->nullable();
            $table->dateTime('date_paiement')->nullable();
            $table->decimal('commission', 10, 2)->nullable();
            $table->decimal('montant_net', 10, 2)->nullable();
            $table->string('statut_reversement')->nullable();
            $table->dateTime('date_reversement')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
