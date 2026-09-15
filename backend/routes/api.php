<?php

use App\Http\Controllers\Api\Annonces\CreneauController;
use App\Http\Controllers\Api\Annonces\TerrainController;
use App\Http\Controllers\Api\Authentification\AuthController;
use App\Http\Controllers\Api\Authentification\ProfilController;
use App\Http\Controllers\Api\Historique\HistoriqueController;
use App\Http\Controllers\Api\Messagerie\MessagerieController;
use App\Http\Controllers\Api\Notation\NotationController;
use App\Http\Controllers\Api\Notation\NoteMoyenneController;
use App\Http\Controllers\Api\Notification\NotificationController;
use App\Http\Controllers\Api\Notification\PushTokenController;
use App\Http\Controllers\Api\Paiement\PaiementController;
use App\Http\Controllers\Api\Paiement\ReversementController;
use App\Http\Controllers\Api\Paiement\WebhookPaiementController;
use App\Http\Controllers\Api\Parrainage\ParrainageController;
use App\Http\Controllers\Api\Recherche\RechercheController;
use App\Http\Controllers\Api\Recherche\TerrainDetailController;
use App\Http\Controllers\Api\Recommandation\RecommandationController;
use App\Http\Controllers\Api\Reservation\ReservationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Module Authentification & Profils — US-01/US-02/US-03, RF-001/RF-002/RF-003
|--------------------------------------------------------------------------
|
| Préfixe /api ajouté automatiquement par withRouting() (bootstrap/app.php) — les URLs ci-dessous
| correspondent exactement à ce qu'appellent déjà packages/auth-core/src/{registerApi,loginApi,
| profileApi}.ts, sans préfixe supplémentaire à improviser.
*/

Route::prefix('auth')->group(function () {
    // RNF-002 : limitation des tentatives (force brute) — jamais vérifiable en QA jusqu'ici
    // faute de backend (rapport-qa.md, TC-002-09). 6 tentatives/minute par IP, valeur standard
    // Laravel pour ce type de route, pas une valeur imposée par le SRS.
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
    Route::get('/', [ProfilController::class, 'show']);
    Route::patch('/', [ProfilController::class, 'update']);
    Route::post('photo', [ProfilController::class, 'uploadPhoto']);
});

/*
|--------------------------------------------------------------------------
| Module Annonces & Créneaux — US-04/US-05/US-06, RF-004/RF-005/RF-006
|--------------------------------------------------------------------------
|
| URLs exactes de packages/annonces-core/src/{terrainApi,creneauApi}.ts. `update`/`destroy` des
| créneaux sont volontairement top-level (/api/creneaux/{creneau}), pas imbriqués sous le
| terrain : updateCreneau/deleteCreneau (creneauApi.ts) n'envoient jamais de terrainId.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('terrains')->group(function () {
        Route::post('/', [TerrainController::class, 'store']);
        Route::get('{terrain}', [TerrainController::class, 'show']);
        Route::patch('{terrain}', [TerrainController::class, 'update']);
        Route::delete('{terrain}', [TerrainController::class, 'destroy']);
        Route::post('{terrain}/photos', [TerrainController::class, 'uploadPhoto']);
        Route::get('{terrain}/creneaux', [CreneauController::class, 'index']);
        Route::post('{terrain}/creneaux', [CreneauController::class, 'store']);
    });

    Route::prefix('creneaux')->group(function () {
        Route::patch('{creneau}', [CreneauController::class, 'update']);
        Route::delete('{creneau}', [CreneauController::class, 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Module Recherche & Catalogue — US-07/US-08/US-09/US-23, RF-007/RF-008/RF-009/RF-022
|--------------------------------------------------------------------------
|
| URLs exactes de packages/recherche-core/src/rechercheApi.ts. Publiques (aucun `auth:sanctum`) :
| un visiteur non connecté doit pouvoir parcourir le catalogue avant même de créer un compte —
| aucun des deux appels n'envoie de token. `terrains/{terrain}/detail` ne collisionne pas avec
| `terrains/{terrain}` (module Annonces, ci-dessus, restreint au propriétaire) : segments
| différents, donc aucun ordre de déclaration à respecter entre les deux groupes.
*/
Route::get('recherche/terrains', [RechercheController::class, 'index']);
Route::get('terrains/{terrain}/detail', [TerrainDetailController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Module Recommandations — US-25, RF-024
|--------------------------------------------------------------------------
|
| URL exacte de packages/recherche-core/src/recommandationApi.ts. Contrairement au module
| Recherche ci-dessus, exige `auth:sanctum` : la suggestion dépend de l'historique personnel du
| joueur connecté.
*/
Route::middleware('auth:sanctum')->get('recommandations/terrains', [RecommandationController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Module Réservation — US-10/US-11/US-22, RF-010/RF-014/RF-021
|--------------------------------------------------------------------------
|
| URLs exactes de packages/reservation-core/src/reservationApi.ts, y compris
| `POST /api/reservations/{id}/annulation` (US-22/RF-021).
|
| `mes-reservations`/`recues` (US-18/US-19, module Historique — RF-018/RF-019) DOIVENT être
| déclarées avant `{reservation}` : Laravel matche les routes dans l'ordre de déclaration, et le
| paramètre `{reservation}` capturerait sinon "mes-reservations" comme un id (404 par liaison de
| modèle plutôt que la bonne route) — piège classique de route wildcard vs. routes littérales.
| `{reservation}/annulation` n'a pas ce problème (verbe POST distinct, deux segments), l'ordre par
| rapport à `{reservation}` (GET) n'a donc pas d'importance ici.
*/
Route::middleware('auth:sanctum')->prefix('reservations')->group(function () {
    Route::post('/', [ReservationController::class, 'store']);
    Route::get('mes-reservations', [HistoriqueController::class, 'mesReservations']);
    Route::get('recues', [HistoriqueController::class, 'recues']);
    Route::get('{reservation}', [ReservationController::class, 'show']);
    Route::post('{reservation}/annulation', [ReservationController::class, 'annuler']);
    // Module Messagerie — US-24, RF-023. URLs exactes de messagerieApi.ts.
    Route::get('{reservation}/messages', [MessagerieController::class, 'index']);
    Route::post('{reservation}/messages', [MessagerieController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Module Paiement — US-12/US-13/US-14, RF-011/RF-012/RF-013/RF-014
|--------------------------------------------------------------------------
|
| POST /api/paiements et GET /api/reversements (US-15/RF-015) : URLs exactes de
| packages/paiement-core/src/paiementApi.ts.
|
| Le webhook n'a PAS `auth:sanctum` (l'appelant est l'opérateur de paiement, pas un utilisateur de
| l'app) — authentifié par signature partagée à la place, voir WebhookPaiementController. Aucun
| contrat frontend ne fixe cette URL/ce payload : c'est un choix provisoire, documenté comme tel
| dans WebhookPaiementRequest (aucun accès aux vraies API/docs Wave/Orange Money/Moov Money ici).
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('paiements', [PaiementController::class, 'store']);
    Route::get('reversements', [ReversementController::class, 'index']);
});
Route::post('paiements/webhook/{operateur}', [WebhookPaiementController::class, 'handle']);

/*
|--------------------------------------------------------------------------
| Module Notation & Réputation — US-16/US-17, RF-016/RF-017
|--------------------------------------------------------------------------
|
| URLs exactes de packages/notation-core/src/notationApi.ts. GET /api/utilisateurs/{utilisateur}
| /note est volontairement public (pas de auth:sanctum) : fetchNoteMoyenne n'envoie jamais de
| token, RF-017 exige que la note reste "visible... avant une réservation".
*/
Route::middleware('auth:sanctum')->post('notations', [NotationController::class, 'store']);
Route::get('utilisateurs/{utilisateur}/note', [NoteMoyenneController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Module Notifications — US-20/US-21, RF-020
|--------------------------------------------------------------------------
|
| URLs exactes de packages/notification-core/src/notificationApi.ts. L'envoi effectif (push FCM,
| email, SMS) reste hors périmètre — aucun service tiers accessible ici (même limite que
| Wave/Orange Money/Moov Money, voir config/paiement.php) : ces routes alimentent/consultent
| uniquement le journal, la création des lignes elles-mêmes étant déclenchée depuis
| TraiterWebhookPaiement (confirmation, US-20) et la tâche planifiée `notifications:rappels-
| creneaux` (rappel, US-21) plutôt que par un appel direct du frontend.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{notification}/lue', [NotificationController::class, 'marquerCommeLue']);
    Route::post('utilisateurs/moi/push-tokens', [PushTokenController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Module Parrainage — US-26, RF-025
|--------------------------------------------------------------------------
|
| URLs exactes de packages/parrainage-core/src/parrainageApi.ts.
*/
Route::middleware('auth:sanctum')->prefix('parrainage')->group(function () {
    Route::get('/', [ParrainageController::class, 'show']);
    Route::post('utiliser', [ParrainageController::class, 'utiliser']);
});
