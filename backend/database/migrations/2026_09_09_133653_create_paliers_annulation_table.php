<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité PALIER_ANNULATION — architecture.md section 3, RF-021 (correction du 9 septembre 2026) :
 * politique d'annulation entièrement configurable par le propriétaire, par terrain, sous forme de
 * paliers illimités (délai avant le créneau → pourcentage remboursé). Supprimée en cascade avec
 * son terrain — un palier n'a aucun sens sans le terrain qu'il configure.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paliers_annulation', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('terrain_id')->constrained('terrains')->cascadeOnDelete();
            $table->unsignedInteger('delai_minutes');
            $table->decimal('pourcentage_remboursement', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paliers_annulation');
    }
};
