<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Entité UTILISATEUR — architecture.md section 3, RF-001/RF-002/RF-003. Colonnes en français
 * pour rester traçable au diagramme ER (aucune traduction/renommage côté base) ; seuls le nom de
 * classe et de table restent en anglais (`User`/`users`), convention Laravel standard requise par
 * Sanctum/l'auth par défaut — voir le commentaire du skill dev-laravel sur ce choix.
 */
#[Fillable(['nom', 'email_ou_telephone', 'mot_de_passe_hash', 'ville', 'photo_url', 'sports_pratiques', 'push_tokens', 'code_parrainage'])]
#[Hidden(['mot_de_passe_hash'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected function casts(): array
    {
        return [
            'mot_de_passe_hash' => 'hashed',
            'sports_pratiques' => 'array',
            'push_tokens' => 'array',
            'note_moyenne' => 'decimal:2',
        ];
    }

    /**
     * Le socle Authenticatable de Laravel suppose par défaut une colonne `password` — la nôtre
     * s'appelle `mot_de_passe_hash` (architecture.md). Ces deux overrides évitent de renommer la
     * colonne pour coller à une convention Laravel qui n'est pas celle du modèle de données déjà
     * validé.
     */
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe_hash;
    }

    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe_hash';
    }
}
