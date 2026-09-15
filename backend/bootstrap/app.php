<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Guard hybride cookie (web) / token Bearer (mobile) — architecture.md, correction du 31
        // août 2026 (BUG-001). statefulApi() fait reconnaître aux routes /api les requêtes
        // provenant d'un domaine listé dans SANCTUM_STATEFUL_DOMAINS comme des requêtes de
        // session (cookie), tout en laissant les autres s'authentifier par jeton Bearer classique
        // — un seul guard `auth:sanctum` couvre les deux (voir routes/api.php).
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
