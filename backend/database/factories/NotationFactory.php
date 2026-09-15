<?php

namespace Database\Factories;

use App\Models\Notation;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notation>
 */
class NotationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'auteur_id' => User::factory(),
            'cible_id' => User::factory(),
            'note' => fake()->numberBetween(1, 5),
            'commentaire' => fake()->optional()->sentence(),
        ];
    }
}
