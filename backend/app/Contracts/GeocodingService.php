<?php

namespace App\Contracts;

/**
 * RF-004/RF-005 : "le géocodage de l'adresse en latitude/longitude est fait côté backend"
 * (packages/annonces-core/src/terrainApi.ts). Interface plutôt qu'appel direct au service choisi
 * — même principe que l'adaptateur de paiement décrit dans architecture.md section 4 pour
 * Wave/Orange Money/Moov Money : isoler le reste de l'application du service tiers réellement
 * utilisé, pour pouvoir le changer ou le mocker sans toucher aux Actions qui en dépendent.
 */
interface GeocodingService
{
    /**
     * @return array{latitude: float|null, longitude: float|null} `null` sur les deux champs si
     *                                                            l'adresse n'a pas pu être géocodée (adresse introuvable, service injoignable...) — un échec
     *                                                            de géocodage ne doit jamais empêcher la création/modification de l'annonce elle-même,
     *                                                            seule la recherche par proximité (RF-007) en pâtit.
     */
    public function geocoder(string $adresse): array;
}
