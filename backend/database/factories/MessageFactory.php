<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'auteur_id' => User::factory(),
            'contenu' => fake()->sentence(),
        ];
    }
}
