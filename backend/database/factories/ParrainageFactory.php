<?php

namespace Database\Factories;

use App\Models\Parrainage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Parrainage>
 */
class ParrainageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'parrain_id' => User::factory(),
            'filleul_id' => User::factory(),
            'statut' => 'valide',
            'avantage' => '10% de réduction sur ta prochaine réservation.',
            'reduction_pourcentage' => 10,
        ];
    }
}
