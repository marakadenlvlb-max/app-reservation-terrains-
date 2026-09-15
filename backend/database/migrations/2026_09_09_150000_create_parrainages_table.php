<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité PARRAINAGE — architecture.md section 3 (ajoutée le 30 août 2026), RF-025.
 *
 * `reduction_pourcentage`/`paiement_id` : ajoutés par la correction du 9 septembre 2026 —
 * l'avantage (`avantage`, texte descriptif) doit réellement réduire un paiement du parrain
 * (décision explicite du porteur de projet), pas rester une simple mention informative. La valeur
 * est capturée par ligne au moment de l'activation plutôt que relue depuis la config à la
 * consommation : un futur changement de barème ne doit pas modifier rétroactivement une
 * récompense déjà accordée — même principe que `PAIEMENT.commission` (US-15).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parrainages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parrain_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('filleul_id')->constrained('users')->cascadeOnDelete();
            $table->string('statut');
            $table->string('avantage')->nullable();
            $table->decimal('reduction_pourcentage', 5, 2);
            $table->foreignUuid('paiement_id')->nullable()->constrained('paiements')->nullOnDelete();
            $table->timestamps();

            // Un même filleul ne peut être rattaché qu'à un seul parrain (UTILISATEUR ||--o|
            // PARRAINAGE : est_filleul, architecture.md section 3).
            $table->unique('filleul_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parrainages');
    }
};
