<?php

namespace Database\Factories;

use App\Models\Terrain;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Terrain>
 */
class TerrainFactory extends Factory
{
    public function definition(): array
    {
        return [
            'proprietaire_id' => User::factory(),
            'sport' => fake()->randomElement(['foot', 'tennis', 'basket']),
            'adresse' => fake()->streetAddress(),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'type' => null,
            'equipements' => [],
            'photos' => [],
            // Valeur de test arbitraire : la colonne n'est pas nullable (voir la migration), mais
            // ce n'est pas une valeur métier — les tests qui exercent le calcul du taux par défaut
            // le font explicitement via AttribuerFraisAnnulationDefaut, pas via cette factory.
            'frais_annulation_pourcentage' => 2,
        ];
    }
}
