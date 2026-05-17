export type PersonalizationChoice = { id: string; label: string };

export const hobbyChoices: PersonalizationChoice[] = [
  { id: 'reading', label: 'Reading & writing' },
  { id: 'outdoors', label: 'Outdoors & hiking' },
  { id: 'fitness', label: 'Fitness & sports' },
  { id: 'cooking', label: 'Cooking & baking' },
  { id: 'music', label: 'Music & instruments' },
  { id: 'art', label: 'Art & design' },
  { id: 'games', label: 'Games & puzzles' },
  { id: 'photo', label: 'Photography & video' },
  { id: 'travel', label: 'Travel & exploring' },
  { id: 'crafts', label: 'Crafts & DIY' },
  { id: 'garden', label: 'Gardening & plants' },
  { id: 'volunteer', label: 'Volunteering' },
];

export const interestChoices: PersonalizationChoice[] = [
  { id: 'wellness', label: 'Wellness & mindfulness' },
  { id: 'science', label: 'Science & nature' },
  { id: 'history', label: 'History & culture' },
  { id: 'faith', label: 'Faith & spirituality' },
  { id: 'community', label: 'Community & neighbors' },
  { id: 'arts', label: 'Creative arts' },
  { id: 'tech', label: 'Technology' },
  { id: 'parenting', label: 'Parenting & family' },
  { id: 'career', label: 'Career & skills' },
  { id: 'finance', label: 'Money & budgeting' },
  { id: 'books', label: 'Books & ideas' },
  { id: 'sustainability', label: 'Sustainability' },
];

export const favoriteActivityChoices: PersonalizationChoice[] = [
  { id: 'walks', label: 'Walks & fresh air' },
  { id: 'friends', label: 'Time with friends' },
  { id: 'quiet', label: 'Quiet time alone' },
  { id: 'family', label: 'Family time' },
  { id: 'learning', label: 'Learning something new' },
  { id: 'sports', label: 'Sports & games' },
  { id: 'movies', label: 'Movies & shows' },
  { id: 'faith_practice', label: 'Faith practice' },
  { id: 'creative', label: 'Creative projects' },
  { id: 'travel_day', label: 'Day trips & travel' },
  { id: 'rest', label: 'Rest & recovery' },
  { id: 'service', label: 'Serving others' },
];

export const goalChoices: PersonalizationChoice[] = [
  { id: 'relationships', label: 'Stronger relationships' },
  { id: 'kind_habits', label: 'Kind daily habits' },
  { id: 'career', label: 'Career momentum' },
  { id: 'health', label: 'Health & energy' },
  { id: 'faith', label: 'Faith & purpose' },
  { id: 'stress', label: 'Less stress' },
  { id: 'skills', label: 'New skills' },
  { id: 'impact', label: 'Community impact' },
  { id: 'finance', label: 'Financial peace' },
  { id: 'organized', label: 'More organized' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'joy', label: 'More joy in routine' },
];

export const growthGoalChoices: PersonalizationChoice[] = [
  { id: 'patience', label: 'Patience' },
  { id: 'courage', label: 'Courage' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'empathy', label: 'Empathy' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'speaking', label: 'Public speaking' },
  { id: 'emotional', label: 'Emotional health' },
  { id: 'spiritual', label: 'Spiritual rhythm' },
  { id: 'learning', label: 'Learning habit' },
  { id: 'generosity', label: 'Generosity' },
  { id: 'creativity', label: 'Creativity' },
  { id: 'balance', label: 'Work-life balance' },
];

export const personalityTraitChoices: PersonalizationChoice[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'curious', label: 'Curious' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'thoughtful', label: 'Thoughtful' },
  { id: 'bold', label: 'Bold' },
  { id: 'organized', label: 'Organized' },
  { id: 'gentle', label: 'Gentle' },
  { id: 'direct', label: 'Direct' },
  { id: 'playful', label: 'Playful' },
  { id: 'steady', label: 'Steady' },
  { id: 'warm', label: 'Warm' },
  { id: 'introspective', label: 'Introspective' },
];

export function choiceIds(set: PersonalizationChoice[]): Set<string> {
  return new Set(set.map((c) => c.id));
}

export function labelsFromChoiceIds(ids: string[], choices: PersonalizationChoice[]): string[] {
  return ids.map((id) => choices.find((c) => c.id === id)?.label ?? id);
}

/** Maps Firestore-stored labels (or legacy ids) back to choice ids for the personalization form. */
export function choiceIdsFromStoredLabels(
  stored: string[] | undefined,
  choices: PersonalizationChoice[],
): string[] {
  if (!stored?.length) {
    return [];
  }
  const ids: string[] = [];
  for (const entry of stored) {
    const t = entry.trim();
    if (!t) {
      continue;
    }
    const byLabel = choices.find((c) => c.label === t);
    if (byLabel) {
      ids.push(byLabel.id);
      continue;
    }
    const byId = choices.find((c) => c.id === t);
    if (byId) {
      ids.push(byId.id);
    }
  }
  return [...new Set(ids)];
}
