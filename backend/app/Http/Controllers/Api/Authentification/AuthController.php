<?php

namespace App\Http\Controllers\Api\Authentification;

use App\Actions\Authentification\ConnecterUtilisateur;
use App\Actions\Authentification\InscrireUtilisateur;
use App\Http\Controllers\Controller;
use App\Http\Requests\Authentification\LoginRequest;
use App\Http\Requests\Authentification\RegisterRequest;
use App\Http\Resources\Authentification\UtilisateurAuthResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * RF-001/RF-002 — Inscription et connexion. Contrat exact déjà attendu par le frontend :
 * packages/auth-core/src/{registerApi,loginApi}.ts.
 */
class AuthController extends Controller
{
    public function register(RegisterRequest $request, InscrireUtilisateur $action): JsonResponse
    {
        $utilisateur = $action->handle($request->validated());

        return (new UtilisateurAuthResource($utilisateur))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Guard hybride (voir bootstrap/app.php, config/sanctum.php) : cette même réponse sert le
     * mobile (le `token` JSON, envoyé ensuite en `Authorization: Bearer`) ET le web
     * (`Auth::login()` ouvre une session dont le cookie HttpOnly est posé automatiquement par
     * `StartSession`, piloté par `EnsureFrontendRequestsAreStateful` pour les requêtes venant
     * d'un domaine listé dans SANCTUM_STATEFUL_DOMAINS). Le web reçoit donc aussi un `token` dans
     * le JSON même s'il ne l'utilise jamais réellement (webSessionStorage ne conserve qu'un
     * marqueur, pas le vrai secret — voir loginApi.ts) : écart volontaire par rapport au mode SPA
     * le plus idiomatique de Sanctum, documenté dans le skill dev-laravel (Étape 4).
     */
    public function login(LoginRequest $request, ConnecterUtilisateur $action): JsonResponse
    {
        $utilisateur = $action->handle($request->validated('identifiant'), $request->validated('motDePasse'));

        if (! $utilisateur) {
            // RNF-002 : message générique — ne jamais préciser si c'est l'identifiant ou le mot
            // de passe qui est incorrect (anti-énumération de comptes), même formulation que le
            // frontend (loginApi.ts) qui l'affiche tel quel de toute façon.
            return response()->json(['message' => 'Identifiant ou mot de passe incorrect.'], 401);
        }

        Auth::guard('web')->login($utilisateur);

        $token = $utilisateur->createToken('api')->plainTextToken;

        // `->additional()` réintroduit l'enveloppe "data" que `withoutWrapping()`
        // (AppServiceProvider) désactive globalement — découvert en testant réellement (voir
        // ResourceResponse::wrap(), qui force le wrapping dès qu'il y a des données
        // "additional"). `->resolve()` récupère juste le tableau de la Resource, fusionné à plat
        // avec le token : c'est le seul moyen d'obtenir exactement la forme de LoginResult.
        return response()->json([
            ...(new UtilisateurAuthResource($utilisateur))->resolve(),
            'token' => $token,
        ]);
    }

    /**
     * RF-002 — La déconnexion doit invalider le cookie de session côté serveur (architecture.md,
     * correction BUG-001) ET révoquer le jeton si la requête en utilisait un (mobile). Pas
     * d'Action dédiée ici : aucune règle métier, seulement des appels d'infrastructure
     * (session/jeton) — voir la note du skill dev-laravel sur ce choix.
     */
    public function logout(Request $request): JsonResponse
    {
        // Session web : `currentAccessToken()` renvoie un TransientToken (pas un enregistrement
        // réel en base) quand l'auth vient du cookie — TransientToken n'a pas de méthode
        // `delete()` (découvert en testant réellement, voir Pest) ; seul un vrai
        // PersonalAccessToken (mobile, Bearer) doit être révoqué ici.
        $jeton = $request->user()?->currentAccessToken();
        if ($jeton instanceof PersonalAccessToken) {
            $jeton->delete();
        }

        // hasSession() : une requête non "stateful" (mobile, ou web hors des domaines listés
        // dans SANCTUM_STATEFUL_DOMAINS) n'a jamais de session démarrée par
        // EnsureFrontendRequestsAreStateful — appeler $request->session() planterait sinon
        // (découvert en testant réellement, voir Pest).
        if ($request->hasSession() && Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(null, 204);
    }
}
