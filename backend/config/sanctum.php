<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort(),
        // Sanctum::currentRequestHost(),
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. This will override any values set in the token's
    | "expires_at" attribute, but first-party sessions are not affected.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | Sanctum can prefix new tokens in order to take advantage of numerous
    | security scanning initiatives maintained by open source platforms
    | that notify developers if they commit tokens into repositories.
    |
    | See: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
    |
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    /*
    | Écart signalé (voir le compte-rendu de la tâche "Authentification", skill dev-laravel) :
    | `validate_csrf_token` est mis à `null` volontairement. Le mode SPA standard de Sanctum
    | attend un aller-retour `GET /sanctum/csrf-cookie` + en-tête `X-XSRF-TOKEN` sur chaque requête
    | mutante, mais le frontend déjà livré (packages/auth-core/src/loginApi.ts et les autres
    | `*Api.ts`) ne l'implémente pas — il n'a jamais été conçu pour. La défense retenue à la place
    | est le cookie de session `SameSite=Lax` déjà imposé par la correction BUG-001
    | (architecture.md, 31 août 2026) : un cookie Lax n'est de toute façon jamais envoyé sur une
    | requête POST/PATCH cross-site par le navigateur, ce qui couvre l'essentiel du risque CSRF
    | classique. Si une double protection par jeton CSRF est souhaitée plus tard, il faudra
    | ajouter la poignée de main `csrf-cookie` côté frontend (hors périmètre du skill dev-laravel,
    | qui ne modifie jamais la logique frontend au-delà de retirer un TODO).
    */
    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => null,
    ],

];
