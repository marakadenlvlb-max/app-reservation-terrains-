<?php

namespace App\Providers;

use App\Contracts\GeocodingService;
use App\Services\NominatimGeocodingService;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Module Annonces (RF-004/RF-005) : voir le commentaire de GeocodingService — isole les
        // Actions du service de géocodage réellement utilisé.
        $this->app->bind(GeocodingService::class, NominatimGeocodingService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Découvert en testant réellement le module Authentification (skill dev-laravel) :
        // JsonResource enveloppe ses réponses dans une clé "data" par défaut, alors que tous les
        // contrats déjà consommés par le frontend (RegisterResult, LoginResult, Profile...) sont
        // des objets JSON à plat (packages/*-core/src/types.ts). Sans ce réglage, chaque endpoint
        // utilisant une API Resource romprait silencieusement le contrat.
        JsonResource::withoutWrapping();
    }
}
