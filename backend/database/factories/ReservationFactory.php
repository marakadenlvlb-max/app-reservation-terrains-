<?php

namespace Database\Factories;

use App\Models\Creneau;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'creneau_id' => Creneau::factory(),
            'joueur_id' => User::factory(),
            'statut' => 'en_attente_paiement',
            'montant' => fake()->randomFloat(2, 5000, 30000),
        ];
    }
}
