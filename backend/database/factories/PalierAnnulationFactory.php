<?php

namespace Database\Factories;

use App\Models\PalierAnnulation;
use App\Models\Terrain;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PalierAnnulation>
 */
class PalierAnnulationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'terrain_id' => Terrain::factory(),
            'delai_minutes' => fake()->randomElement([1440, 720, 60]),
            'pourcentage_remboursement' => fake()->randomElement([100, 50, 0]),
        ];
    }
}
