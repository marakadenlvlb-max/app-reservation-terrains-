<?php

namespace Database\Factories;

use App\Models\Creneau;
use App\Models\Terrain;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Creneau>
 */
class CreneauFactory extends Factory
{
    public function definition(): array
    {
        $debut = fake()->dateTimeBetween('+1 day', '+1 month');

        return [
            'terrain_id' => Terrain::factory(),
            'debut' => $debut,
            'fin' => (clone $debut)->modify('+1 hour'),
            'tarif' => fake()->randomFloat(2, 5000, 30000),
            'statut' => 'disponible',
        ];
    }
}
