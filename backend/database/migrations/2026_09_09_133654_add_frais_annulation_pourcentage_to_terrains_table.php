<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TERRAIN.frais_annulation_pourcentage — architecture.md section 3 (correction du 9 septembre
 * 2026), RF-021. Volontairement NON nullable : ce champ est toujours renseigné dès la création du
 * terrain (soit la valeur saisie par le propriétaire, soit le taux par défaut calculé selon le
 * barème dégressif — voir PublierAnnonce/AttribuerFraisAnnulationDefaut), jamais recalculé à la
 * volée au moment d'un remboursement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terrains', function (Blueprint $table) {
            $table->decimal('frais_annulation_pourcentage', 5, 2)->after('photos');
        });
    }

    public function down(): void
    {
        Schema::table('terrains', function (Blueprint $table) {
            $table->dropColumn('frais_annulation_pourcentage');
        });
    }
};
