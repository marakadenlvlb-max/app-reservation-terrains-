<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| RefreshDatabase sur Feature : chaque test tourne sur une base SQLite en mémoire fraîche
| (phpunit.xml, DB_CONNECTION=sqlite / DB_DATABASE=:memory:) — indépendant de la connexion
| PostgreSQL réelle utilisée en développement/production (architecture.md).
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(TestCase::class)->in('Unit');
