<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité NOTATION — architecture.md section 3, RF-016. `cible_id` référence toujours un
 * UTILISATEUR (pas de `terrain_id`) : le "(et/ou le terrain)" du texte de RF-016 n'est pas
 * modélisé séparément dans architecture.md, la cible d'une notation reste une personne (le
 * commentaire de `Notation.cibleId`, packages/notation-core/src/types.ts, ne parle d'ailleurs
 * jamais de terrain).
 *
 * Contrainte unique (reservation_id, auteur_id) : un même auteur ne peut noter la même réservation
 * qu'une seule fois — pas une règle explicitement écrite dans le SRS, mais un garde-fou
 * d'intégrité raisonnable (empêcher de fausser une moyenne en notant plusieurs fois la même
 * session), du même ordre que les vérifications d'autorisation déjà appliquées ailleurs (ex.
 * "seul le propriétaire modifie son annonce") plutôt qu'une politique métier à trancher.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignUuid('auteur_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('cible_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('note');
            $table->string('commentaire')->nullable();
            $table->timestamps();

            $table->unique(['reservation_id', 'auteur_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notations');
    }
};
