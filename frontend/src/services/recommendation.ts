/** Deterministic, explainable service recommendation. No external AI involved. */

import type { Service } from '../types';

export type LookAnswer = 'natural' | 'soft' | 'glamour';
export type FinishAnswer = 'natural' | 'dramatic';
export type VisitAnswer = 'full' | 'maintenance' | 'unsure';

export interface RecommendationAnswers {
  look: LookAnswer;
  firstVisit: boolean;
  finish: FinishAnswer;
  visit: VisitAnswer;
}

export interface Recommendation {
  serviceId: number | null;
  reasons: string[];
  alternativeId: number | null;
  disclaimer: string;
}

interface ScoreCard {
  score: number;
  reasons: string[];
}

const DISCLAIMER =
  'This is a sample, rule-based suggestion for demonstration only. It is not professional advice — Mina can help you choose.';

function add(card: ScoreCard, points: number, reason: string): void {
  if (points <= 0) return;
  card.score += points;
  card.reasons.push(reason);
}

function cardFor(service: Service): ScoreCard {
  const name = service.name.toLowerCase();
  const card: ScoreCard = { score: 0, reasons: [] };

  if (name.includes('consultation')) {
    return card;
  }
  if (name.includes('removal')) {
    return card;
  }

  if (name.includes('classic')) {
    return card;
  }
  if (name.includes('hybrid')) {
    return card;
  }
  if (name.includes('volume')) {
    return card;
  }
  if (name.includes('refill')) {
    return card;
  }
  return card;
}

/** Recommend a service from the active sample menu using transparent rules. */
export function recommend(answers: RecommendationAnswers, services: Service[]): Recommendation {
  const active = services.filter((service) => service.is_active);
  const find = (fragment: string): Service | undefined =>
    active.find((service) => service.name.toLowerCase().includes(fragment));

  const consultation = find('consultation');
  const classic = find('classic');
  const hybrid = find('hybrid');
  const volume = find('volume');
  const refill = find('refill');

  const cards = new Map<Service, ScoreCard>();
  const ensure = (service: Service | undefined): ScoreCard | null => {
    if (!service) return null;
    let card = cards.get(service);
    if (!card) {
      card = cardFor(service);
      cards.set(service, card);
    }
    return card;
  };

  if (answers.firstVisit) {
    const card = ensure(consultation);
    if (card) add(card, 4, 'A consultation is a sensible first step for a first visit.');
  }
  if (answers.visit === 'unsure') {
    const card = ensure(consultation);
    if (card) add(card, 2, 'You are still deciding which appointment suits you.');
  }
  if (answers.visit === 'maintenance') {
    const card = ensure(refill);
    if (card) add(card, 5, 'You asked for maintenance rather than a full set.');
  }
  if (answers.visit === 'full') {
    if (answers.firstVisit) {
      const card = ensure(classic);
      if (card) add(card, 2, 'A classic full set is a gentle sample starting point.');
    }
    if (answers.look === 'glamour' || answers.finish === 'dramatic') {
      const card = ensure(volume);
      if (card) add(card, 4, 'You described a fuller, more dramatic finish.');
    }
    if (answers.look === 'soft' || (answers.look === 'natural' && answers.finish === 'natural')) {
      const card = ensure(hybrid);
      if (card) add(card, 3, 'A balanced style matches your soft, defined preference.');
    }
    if (answers.look === 'natural') {
      const card = ensure(classic);
      if (card) add(card, 2, 'A classic set suits an everyday natural look.');
    }
  }

  const ranked = [...cards.entries()].sort((left, right) => right[1].score - left[1].score);
  const winner = ranked[0];
  if (!winner || winner[1].score === 0) {
    const fallback = classic ?? active[0] ?? null;
    return {
      serviceId: fallback?.id ?? null,
      reasons: ['No strong preference was detected, so this is the default sample option.'],
      alternativeId: null,
      disclaimer: DISCLAIMER,
    };
  }

  const alternative = ranked[1];
  return {
    serviceId: winner[0].id,
    reasons: winner[1].reasons,
    alternativeId: alternative ? alternative[0].id : null,
    disclaimer: DISCLAIMER,
  };
}
