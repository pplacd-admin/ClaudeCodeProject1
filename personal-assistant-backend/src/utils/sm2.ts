export interface SM2Record {
  easeFactor: number;   // starts at 2.5, minimum 1.3
  interval: number;     // days until next review
  repetitions: number;  // consecutive correct answers
}

export function sm2Update(record: SM2Record, quality: number): SM2Record {
  // quality: 0–5 (map quiz score 0.0–1.0 to quality via Math.round(score * 5))
  // 0 = complete blackout, 3 = correct with difficulty, 5 = perfect
  let { easeFactor, interval, repetitions } = record;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  return { easeFactor, interval, repetitions };
}

export function getNextReviewDate(intervalDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date;
}

export function scoreToQuality(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 5);
}
