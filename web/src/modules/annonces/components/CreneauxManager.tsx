'use client';

import { useState } from 'react';
import { useSessionToken } from '@app/auth-core';
import { useCreneaux, type Creneau } from '@app/annonces-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  reserve: 'Réservé',
};

/**
 * Gestion des créneaux d'un terrain — US-05 (ajout) / US-06 (modification, retrait), module
 * Annonces & Créneaux (RF-006). `terrainId` vient de la route (page dynamique
 * /terrains/[terrainId]/creneaux) — pas de contexte global "terrain courant" pour l'instant,
 * comme pour le routing post-connexion (voir TODOs US-01/US-02).
 */
export function CreneauxManager({ terrainId }: { terrainId: string }) {
  // BUG-004 (rapport-qa.md, corrigé le 31 août 2026) : useSessionToken élimine à la racine le
  // défaut qui confondait "pas encore lu" et "confirmé non connecté" (troisième occurrence de ce
  // motif dans le projet avant l'extraction de ce hook partagé).
  const token = useSessionToken(webSessionStorage);

  const {
    creneaux,
    loading,
    loadError,
    debut,
    fin,
    tarif,
    errors,
    submitting,
    submitError,
    setDebut,
    setFin,
    setTarif,
    addCreneau,
    updatingId,
    updateError,
    updateCreneau,
    removingId,
    removeError,
    removeCreneau,
  } = useCreneaux({ terrainId, apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
    return <p>Chargement des créneaux…</p>;
  }

  if (loadError && creneaux.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {loadError}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Créneaux du terrain</h1>
        {creneaux.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun créneau défini pour l'instant.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {creneaux.map((creneau) => (
              <CreneauRow
                key={creneau.id}
                creneau={creneau}
                updating={updatingId === creneau.id}
                removing={removingId === creneau.id}
                onSave={(payload) => updateCreneau(creneau.id, payload)}
                onRemove={() => removeCreneau(creneau.id)}
              />
            ))}
          </ul>
        )}
        {updateError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {updateError}
          </p>
        )}
        {removeError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {removeError}
          </p>
        )}
      </div>

      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void addCreneau();
        }}
      >
        <h2 className="text-lg font-semibold">Ajouter un créneau</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="debut" className="text-sm font-medium">
            Début
          </label>
          <input
            id="debut"
            type="datetime-local"
            value={debut}
            onChange={(event) => setDebut(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
            aria-invalid={Boolean(errors.debut)}
          />
          {errors.debut && <p className="text-sm text-red-600">{errors.debut}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fin" className="text-sm font-medium">
            Fin
          </label>
          <input
            id="fin"
            type="datetime-local"
            value={fin}
            onChange={(event) => setFin(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
            aria-invalid={Boolean(errors.fin)}
          />
          {errors.fin && <p className="text-sm text-red-600">{errors.fin}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tarif" className="text-sm font-medium">
            Tarif
          </label>
          <input
            id="tarif"
            type="number"
            min="0"
            step="0.01"
            value={tarif}
            onChange={(event) => setTarif(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
            aria-invalid={Boolean(errors.tarif)}
          />
          {errors.tarif && <p className="text-sm text-red-600">{errors.tarif}</p>}
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Ajout en cours…' : 'Ajouter le créneau'}
        </button>
      </form>
    </div>
  );
}

interface CreneauRowProps {
  creneau: Creneau;
  updating: boolean;
  removing: boolean;
  onSave: (payload: { debut: string; fin: string; tarif: number }) => Promise<boolean>;
  onRemove: () => void;
}

/**
 * Une ligne = un créneau, avec son propre mode édition local. Un créneau réservé (RF-010) ne
 * peut ni être modifié ni retiré — les boutons sont désactivés plutôt que masqués, pour que ce
 * soit visible que l'action existe mais n'est pas permise dans cet état.
 */
function CreneauRow({ creneau, updating, removing, onSave, onRemove }: CreneauRowProps) {
  const [editing, setEditing] = useState(false);
  const [debut, setDebut] = useState(creneau.debut);
  const [fin, setFin] = useState(creneau.fin);
  const [tarif, setTarif] = useState(String(creneau.tarif));
  const reserve = creneau.statut === 'reserve';

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
        <span>
          <span className="font-medium">
            {creneau.debut.replace('T', ' ')} → {creneau.fin.replace('T', ' ')}
          </span>{' '}
          — {creneau.tarif} — {STATUT_LABELS[creneau.statut] ?? creneau.statut}
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={reserve}
            className="text-blue-600 disabled:text-gray-400"
            title={reserve ? 'Un créneau réservé ne peut plus être modifié' : undefined}
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={reserve || removing}
            className="text-red-600 disabled:text-gray-400"
            title={reserve ? 'Un créneau réservé ne peut plus être retiré' : undefined}
          >
            {removing ? 'Retrait…' : 'Retirer'}
          </button>
        </span>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
      <label className="flex flex-col gap-1">
        Début
        <input
          type="datetime-local"
          value={debut}
          onChange={(event) => setDebut(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Fin
        <input
          type="datetime-local"
          value={fin}
          onChange={(event) => setFin(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Tarif
        <input
          type="number"
          min="0"
          step="0.01"
          value={tarif}
          onChange={(event) => setTarif(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <span className="flex gap-2">
        <button
          type="button"
          disabled={updating}
          onClick={async () => {
            // Ne referme le mode édition qu'en cas de succès réel : sinon l'utilisateur perdrait
            // ses valeurs saisies sans comprendre pourquoi (voir le booléen renvoyé par useCreneaux).
            const success = await onSave({ debut, fin, tarif: Number(tarif) });
            if (success) setEditing(false);
          }}
          className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
        >
          {updating ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded border border-gray-300 px-3 py-1">
          Annuler
        </button>
      </span>
    </li>
  );
}
