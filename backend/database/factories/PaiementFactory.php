<?php

namespace Database\Factories;

use App\Models\Paiement;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Paiement>
 */
class PaiementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'operateur' => fake()->randomElement(['wave', 'orange_money', 'moov_money']),
            'statut' => 'en_attente',
            'montant' => fake()->randomFloat(2, 5000, 30000),
            'reference_externe' => null,
            'date_paiement' => null,
        ];
    }
}
