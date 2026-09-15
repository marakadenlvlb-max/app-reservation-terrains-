<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Entité NOTIFICATION — architecture.md section 3, RF-020. `reservation_id` nullable :
 * `Notification.reservationId` (packages/notification-core/src/types.ts) est explicitement
 * documenté comme `null` "si la notification n'est pas liée à une réservation précise" — le
 * diagramme ER ne marque pas la nullabilité des colonnes (comme ailleurs dans ce projet, ex.
 * `TERRAIN.type`), donc c'est le contrat frontend qui fait foi ici.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('destinataire_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('reservation_id')->nullable()->constrained('reservations')->nullOnDelete();
            $table->string('type');
            $table->string('titre');
            $table->text('message');
            $table->boolean('lue')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
