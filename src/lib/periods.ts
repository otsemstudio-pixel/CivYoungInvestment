import type { Contribution, Goal, GoalCadence } from "@/lib/types";

const DAY_MS = 86_400_000;

export function toDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function addMonthsUTC(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()),
  );
}

function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function nextPeriodStart(periodStart: Date, cadence: GoalCadence): Date {
  switch (cadence) {
    case "hebdomadaire":
      return addDaysUTC(periodStart, 7);
    case "quinzaine":
      return addDaysUTC(periodStart, 14);
    case "mensuelle":
      return addMonthsUTC(periodStart, 1);
  }
}

export function previousPeriodStart(periodStart: Date, cadence: GoalCadence): Date {
  switch (cadence) {
    case "hebdomadaire":
      return addDaysUTC(periodStart, -7);
    case "quinzaine":
      return addDaysUTC(periodStart, -14);
    case "mensuelle":
      return addMonthsUTC(periodStart, -1);
  }
}

/** Premier period_start à partir de created_at (§4.1), selon la cadence et l'ancre. */
export function firstPeriodStart(
  createdAt: Date,
  cadence: GoalCadence,
  anchor: number,
): Date {
  if (cadence === "mensuelle") {
    let candidate = new Date(
      Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), anchor),
    );
    if (candidate < createdAt) candidate = addMonthsUTC(candidate, 1);
    return candidate;
  }
  const diff = (anchor - isoWeekday(createdAt) + 7) % 7;
  return addDaysUTC(createdAt, diff);
}

/** period_start de la période en cours à la date `today`, ou null si la
 * première période n'a pas encore commencé. */
export function currentPeriodStart(
  createdAt: Date,
  cadence: GoalCadence,
  anchor: number,
  today: Date,
): Date | null {
  const first = firstPeriodStart(createdAt, cadence, anchor);
  if (today < first) return null;

  if (cadence === "mensuelle") {
    let monthsElapsed =
      (today.getUTCFullYear() - first.getUTCFullYear()) * 12 +
      (today.getUTCMonth() - first.getUTCMonth());
    let candidate = addMonthsUTC(first, monthsElapsed);
    if (candidate > today) {
      monthsElapsed -= 1;
      candidate = addMonthsUTC(first, monthsElapsed);
    }
    return candidate;
  }

  const stepDays = cadence === "hebdomadaire" ? 7 : 14;
  const diffDays = Math.floor((today.getTime() - first.getTime()) / DAY_MS);
  const periodsElapsed = Math.floor(diffDays / stepDays);
  return addDaysUTC(first, periodsElapsed * stepDays);
}

/** Nombre de périodes de periodStart (inclus) jusqu'à deadline (incluse). */
export function periodsUntil(
  periodStart: Date,
  cadence: GoalCadence,
  deadline: Date,
): number {
  let count = 0;
  let p = periodStart;
  let iterations = 0;
  while (p <= deadline && iterations < 1000) {
    count++;
    p = nextPeriodStart(p, cadence);
    iterations++;
  }
  return count;
}

/** Montant théorique par période (§4.2), recalculé à chaque période. */
export function theoreticalAmountXof(
  goal: Pick<Goal, "target_xof" | "deadline" | "cadence">,
  alreadyVerseXof: number,
  periodStart: Date,
): number | null {
  const deadline = toDateOnly(goal.deadline);
  const remainingPeriods = periodsUntil(periodStart, goal.cadence, deadline);
  if (remainingPeriods <= 0) return null;
  const remainingTarget = Math.max(0, goal.target_xof - alreadyVerseXof);
  return Math.round(remainingTarget / remainingPeriods);
}

export interface GoalProgress {
  totalVerseXof: number;
  progressPct: number;
  currentPeriodStartIso: string | null;
  theoreticalAmountXof: number | null;
  currentPeriodContribution: Contribution | null;
}

export function computeGoalProgress(
  goal: Goal,
  contributions: Contribution[],
  today: Date = toDateOnly(toIsoDate(new Date())),
): GoalProgress {
  const totalVerseXof = contributions
    .filter((c) => c.kind === "verse")
    .reduce((sum, c) => sum + c.amount_xof, 0);
  const progressPct =
    goal.target_xof > 0
      ? Math.min(100, Math.round((totalVerseXof / goal.target_xof) * 100))
      : 0;

  const createdAt = toDateOnly(toIsoDate(new Date(goal.created_at)));
  const periodStart = currentPeriodStart(
    createdAt,
    goal.cadence,
    goal.cadence_anchor,
    today,
  );

  if (!periodStart) {
    return {
      totalVerseXof,
      progressPct,
      currentPeriodStartIso: null,
      theoreticalAmountXof: null,
      currentPeriodContribution: null,
    };
  }

  const currentPeriodStartIso = toIsoDate(periodStart);
  const currentPeriodContribution =
    contributions.find((c) => c.period_start === currentPeriodStartIso) ?? null;

  return {
    totalVerseXof,
    progressPct,
    currentPeriodStartIso,
    theoreticalAmountXof: theoreticalAmountXof(goal, totalVerseXof, periodStart),
    currentPeriodContribution,
  };
}

/** Fenêtre glissante du joker (§4.3) : au plus une rupture absorbée par
 * tranche de 90 jours. */
export const JOKER_WINDOW_DAYS = 90;

export interface StreakInfo {
  streak: number;
  jokerUsedAtIso: string | null;
  nextPeriodStartIso: string | null;
}

/**
 * Série (§4.2) et joker (§4.3), recalculés à la volée.
 *
 * On part de la période en cours et on remonte les périodes closes une à
 * une. Un `verse` prolonge la série. Une rupture (rien, ou `saute`) est
 * absorbée par le joker si elle est la première rencontrée dans cette
 * remontée, ou si plus de 90 jours se sont écoulés depuis la dernière
 * rupture absorbée (fenêtre glissante) ; sinon la remontée s'arrête là.
 */
export function computeStreak(
  goal: Pick<Goal, "created_at" | "cadence" | "cadence_anchor">,
  contributions: Contribution[],
  today: Date = toDateOnly(toIsoDate(new Date())),
): StreakInfo {
  const createdAt = toDateOnly(toIsoDate(new Date(goal.created_at)));
  const current = currentPeriodStart(createdAt, goal.cadence, goal.cadence_anchor, today);

  if (!current) {
    return { streak: 0, jokerUsedAtIso: null, nextPeriodStartIso: null };
  }

  const contributionByPeriod = new Map(contributions.map((c) => [c.period_start, c]));
  const first = firstPeriodStart(createdAt, goal.cadence, goal.cadence_anchor);

  let streak = 0;
  const currentContribution = contributionByPeriod.get(toIsoDate(current));
  if (currentContribution?.kind === "verse") streak += 1;

  let jokerUsedAt: Date | null = null;
  let p = previousPeriodStart(current, goal.cadence);
  let iterations = 0;

  while (p >= first && iterations < 2000) {
    iterations++;
    const contribution = contributionByPeriod.get(toIsoDate(p));

    if (contribution?.kind === "verse") {
      streak += 1;
      p = previousPeriodStart(p, goal.cadence);
      continue;
    }

    // Rupture : pas de contribution, ou "saute".
    if (jokerUsedAt === null) {
      jokerUsedAt = p;
      p = previousPeriodStart(p, goal.cadence);
      continue;
    }

    const daysSinceJoker = Math.round((jokerUsedAt.getTime() - p.getTime()) / DAY_MS);
    if (daysSinceJoker > JOKER_WINDOW_DAYS) {
      jokerUsedAt = p;
      p = previousPeriodStart(p, goal.cadence);
      continue;
    }

    break;
  }

  return {
    streak,
    jokerUsedAtIso: jokerUsedAt ? toIsoDate(jokerUsedAt) : null,
    nextPeriodStartIso: toIsoDate(nextPeriodStart(current, goal.cadence)),
  };
}
