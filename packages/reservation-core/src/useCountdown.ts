import { useEffect, useState } from 'react';

export interface UseCountdownResult {
  remainingSeconds: number;
  expired: boolean;
}

/**
 * Compte à rebours jusqu'à une échéance ISO 8601 — utilisé pour afficher concrètement le
 * verrouillage temporaire d'un créneau (US-10 / RF-010, `Reservation.expireA`). Recalcule à
 * partir de l'heure système à chaque tick plutôt que de décrémenter un compteur local : évite
 * une dérive si l'onglet/l'app reste en arrière-plan un moment (setInterval n'est pas garanti
 * précis dans ce cas).
 */
export function useCountdown(expireA: string | null): UseCountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(() => computeRemaining(expireA));

  useEffect(() => {
    if (!expireA) {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(computeRemaining(expireA));
    const interval = setInterval(() => {
      setRemainingSeconds(computeRemaining(expireA));
    }, 1000);

    return () => clearInterval(interval);
  }, [expireA]);

  return { remainingSeconds, expired: remainingSeconds <= 0 };
}

function computeRemaining(expireA: string | null): number {
  if (!expireA) return 0;
  const diffMs = new Date(expireA).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}
