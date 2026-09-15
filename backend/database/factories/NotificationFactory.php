<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'destinataire_id' => User::factory(),
            'reservation_id' => null,
            'type' => 'confirmation_reservation',
            'titre' => 'Réservation confirmée',
            'message' => 'Ta réservation est confirmée.',
            'lue' => false,
        ];
    }
}
