<?php

/*
| Configuration CORS — nécessaire car le web (Next.js, http://localhost:3000) appelle l'API
| Laravel (http://127.0.0.1:8000) en cross-origin avec `credentials: 'include'` (cookie de
| session Sanctum, voir packages/auth-core/src/loginApi.ts et BUG-001 dans rapport-qa.md).
|
| Un navigateur rejette toute réponse à une requête `credentials: include` si
| `Access-Control-Allow-Origin` vaut `*` ou si `Access-Control-Allow-Credentials` est absent
| — d'où `supports_credentials => true` et une liste d'origines explicite (jamais `*`) ci-dessous,
| alignée sur SANCTUM_STATEFUL_DOMAINS déjà défini dans .env pour le cookie de session lui-même.
*/

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_map(
        static fn (string $domain): string => str_contains($domain, '://') ? $domain : "http://{$domain}",
        array_filter(explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,127.0.0.1,127.0.0.1:3000'))),
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
