<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Entité UTILISATEUR — architecture.md section 3, colonnes reprises telles que documentées
     * (y compris les corrections du 29/30 août 2026 : sports_pratiques, push_tokens,
     * code_parrainage). Clé primaire en UUID : c'est un choix explicite du modèle de données
     * (`uuid id` sur chaque entité du diagramme ER), pas une convention Laravel par défaut.
     *
     * Colonnes du scaffold Laravel par défaut volontairement retirées (`name`, `email`,
     * `email_verified_at`, `remember_token`) : aucune n'est prévue par RF-001/RF-003 ni par
     * l'entité UTILISATEUR — `nom` et `email_ou_telephone` les remplacent avec les noms
     * documentés, et rien dans le SRS ne prévoit de vérification d'email ni de "se souvenir de
     * moi" (LoginPayload ne porte que identifiant + motDePasse, packages/auth-core/src/types.ts).
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom')->nullable();
            // RF-001 : "email OU téléphone" — un seul champ, comme côté frontend
            // (isEmailOrPhone() dans packages/auth-core/src/validation.ts) plutôt que deux
            // colonnes email/téléphone dont une serait systématiquement vide.
            $table->string('email_ou_telephone')->unique();
            $table->string('mot_de_passe_hash');
            $table->string('ville')->nullable();
            $table->string('photo_url')->nullable();
            // sports_pratiques / push_tokens : json plutôt qu'une table de jointure — voir la
            // note du 29 août 2026 dans architecture.md (aucune exigence actuelle ne requiert de
            // requêter les utilisateurs par sport ou par jeton push individuellement).
            $table->json('sports_pratiques')->default('[]');
            $table->json('push_tokens')->default('[]');
            // US-26 / RF-025 : chaque utilisateur a son propre code à partager, généré à la
            // création du compte (voir CreerUtilisateur, module Authentification).
            $table->string('code_parrainage')->unique();
            $table->decimal('note_moyenne', 3, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            // uuid plutôt que foreignId : doit correspondre au type de UTILISATEUR.id ci-dessus.
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
