<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Le mot de passe en clair utilisé par le factory (avant hashage) — pratique dans les tests
     * pour appeler login avec un mot de passe connu (voir tests/Feature/Authentification).
     */
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'nom' => fake()->name(),
            'email_ou_telephone' => fake()->unique()->safeEmail(),
            'mot_de_passe_hash' => static::$password ??= Hash::make('password'),
            'ville' => fake()->city(),
            'photo_url' => null,
            // RF-001 : au moins un sport pratiqué requis à l'inscription.
            'sports_pratiques' => [fake()->randomElement(['foot', 'tennis', 'basket'])],
            'push_tokens' => [],
            'code_parrainage' => Str::upper(Str::random(8)),
            'note_moyenne' => null,
        ];
    }
}
