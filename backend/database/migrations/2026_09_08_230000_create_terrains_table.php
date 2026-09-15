<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité TERRAIN — architecture.md section 3, RF-004/RF-005. `latitude`/`longitude` sont
 * nullable : elles ne sont connues qu'après géocodage de `adresse` (voir
 * app/Services/NominatimGeocodingService.php), qui peut échouer sans empêcher la création de
 * l'annonce (RF-007, la recherche par proximité, est un plus — pas une condition d'existence du
 * terrain).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terrains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('proprietaire_id')->constrained('users')->cascadeOnDelete();
            $table->string('sport');
            $table->string('adresse');
            $table->float('latitude')->nullable();
            $table->float('longitude')->nullable();
            $table->string('type')->nullable();
            $table->json('equipements')->default('[]');
            $table->json('photos')->default('[]');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terrains');
    }
};
