<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité CRENEAU — architecture.md section 3, RF-006. `statut` reste une chaîne ouverte (voir
 * CreneauStatut dans packages/annonces-core/src/types.ts) : seuls 'disponible' (valeur par
 * défaut à la création) et 'reserve' sont connus avec certitude tant que le verrouillage
 * temporaire (US-10, RF-010) n'est pas implémenté côté backend.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('creneaux', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('terrain_id')->constrained('terrains')->cascadeOnDelete();
            $table->dateTime('debut');
            $table->dateTime('fin');
            $table->decimal('tarif', 10, 2);
            $table->string('statut')->default('disponible');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creneaux');
    }
};
