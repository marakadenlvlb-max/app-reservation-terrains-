<?php

namespace App\Http\Requests\Notification;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-020 — Contrat exact de enregistrerPushToken (notificationApi.ts) : { pushToken }.
 */
class EnregistrerPushTokenRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pushToken' => ['required', 'string'],
        ];
    }
}
