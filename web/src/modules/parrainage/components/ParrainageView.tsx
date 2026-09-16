'use client';

import { useEffect, useState } from 'react';
import { useParrainage } from '@app/parrainage-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  valide: 'Avantage accordé',
  // BUG-008 (rapport-qa.md, corrigé le 9 septembre 2026) : le backend introduit 'utilise' une
  // fois la réduction consommée (voir InitierPaiement, module Paiement) — absent ici jusqu'à
  // présent, la valeur brute fuyait telle quelle dans l'UI.
  utilise: 'Avantage utilisé',
};

/**
 * Parrainage — US-26 / RF-025, module Parrainage. Deux volets sur un seul écran : consulter son
 * propre code + le suivi des filleuls déjà parrainés, et utiliser le code reçu d'un autre
 * utilisateur — voir l'hypothèse de portée documentée dans architecture.md (saisie du code a
 * posteriori depuis cet écran, pas au moment de l'inscription US-01/RF-001).
 */
export function ParrainageView() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [code, setCode] = useState('');

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { resume, loading, error, submitting, submitError, submitted, utiliserCode } = useParrainage({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  // Vide le champ une fois le code accepté, pas avant : contrairement à l'envoi d'un message
  // (US-24), un code refusé doit rester visible pour que l'utilisateur puisse le corriger.
  useEffect(() => {
    if (submitted) setCode('');
  }, [submitted]);

  if (token === undefined || loading) {
    return <p>Chargement de ton parrainage…</p>;
  }

  if (error && !resume) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Parrainage</h1>
        {resume && (
          <p className="text-sm text-gray-700">
            Ton code à partager : <span className="font-mono font-semibold">{resume.codeParrainage}</span>
          </p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium">Tes filleuls</h2>
        {!resume || resume.filleuls.length === 0 ? (
          <p className="text-sm text-gray-500">Tu n'as encore parrainé personne.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {resume.filleuls.map((filleul) => (
              <li key={filleul.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
                <p className="font-medium">{filleul.nom}</p>
                <p className="text-gray-600">
                  {STATUT_LABELS[filleul.statut] ?? filleul.statut}
                  {/* BUG-008 : une fois consommé, `avantage` ("... sur ta prochaine réservation")
                      redevient trompeur rétrospectivement — le statut "Avantage utilisé" suffit. */}
                  {filleul.avantage && filleul.statut !== 'utilise' && ` — ${filleul.avantage}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void utiliserCode(code);
        }}
      >
        <label htmlFor="code" className="text-sm font-medium">
          Tu as reçu un code de parrainage ?
        </label>
        <div className="flex gap-2">
          <input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ex. AWA1234"
            className="flex-1 rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Utiliser'}
          </button>
        </div>
        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
        {submitted && <p className="text-sm text-green-700">Code accepté !</p>}
      </form>
    </div>
  );
}
