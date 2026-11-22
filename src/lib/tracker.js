export const todayKey = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function normalizeLog(date, log = {}) {
  const foodEntries = Array.isArray(log.foodEntries)
    ? log.foodEntries.map((entry) => ({
        id: entry.id || createId(),
        name: entry.name || 'Meal',
        calories: Math.max(0, Number(entry.calories) || 0),
      }))
    : Number(log.calories) > 0
      ? [{ id: `legacy-food-${date}`, name: 'Previously logged food', calories: Number(log.calories) }]
      : [];
  const workouts = Array.isArray(log.workouts)
    ? log.workouts.map((workout) => ({
        id: workout.id || createId(),
        name: workout.name || 'Workout',
        caloriesBurned: Math.max(0, Number(workout.caloriesBurned) || 0),
      }))
    : log.gym
      ? [{ id: `legacy-workout-${date}`, name: log.workoutType || 'Gym session', caloriesBurned: 0 }]
      : [];

  return {
    ...log,
    foodEntries,
    workouts,
    calories: foodEntries.reduce((sum, entry) => sum + entry.calories, 0),
    gym: workouts.length > 0 || Boolean(log.gym),
  };
}

export function loadTrackerData() {
  try {
    const profile = JSON.parse(localStorage.getItem('pc_profile') || 'null');
    const rawLogs = JSON.parse(localStorage.getItem('pc_logs') || '{}');
    const weightHistory = JSON.parse(localStorage.getItem('pc_weight_history') || '[]');
    const logs = Object.fromEntries(
      Object.entries(rawLogs).map(([date, log]) => [date, normalizeLog(date, log)]),
    );
    return {
      profile,
      logs,
      weightHistory: Array.isArray(weightHistory) ? weightHistory : [],
    };
  } catch (error) {
    console.error('Could not read saved PocketCoach data:', error);
    return { profile: null, logs: {}, weightHistory: [] };
  }
}

export function persistTrackerData(data) {
  localStorage.setItem('pc_profile', JSON.stringify(data.profile));
  localStorage.setItem('pc_logs', JSON.stringify(data.logs));
  localStorage.setItem('pc_weight_history', JSON.stringify(data.weightHistory));
}

export function getLog(logs, date) {
  return logs[date] || { calories: 0, gym: false, foodEntries: [], workouts: [] };
}

export function getBurnedCalories(log, profile) {
  const baseline = Number(profile?.tdee) || 0;
  const exercise = (log.workouts || []).reduce(
    (sum, workout) => sum + (Number(workout.caloriesBurned) || 0),
    0,
  );
  return { baseline, exercise, total: baseline + exercise };
}

export function estimateMealCalories(description) {
  const foods = [
    { terms: /\b(?:white|brown|cooked)?\s*rice\b/i, calories: 205, unit: 'cup', quantity: /([\d.]+)\s*cups?\s*(?:of\s+)?(?:white\s+|brown\s+)?rice\b/i },
    { terms: /\badobo\b/i, calories: 280, unit: 'serving', quantity: /([\d.]+)\s*(?:servings?|pieces?)?\s*(?:of\s+)?(?:chicken\s+|pork\s+)?adobo\b/i },
    { terms: /\beggs?\b/i, calories: 78, unit: 'piece', quantity: /([\d.]+)\s*(?:eggs?)\b/i },
    { terms: /\b(?:chicken|breast)\b/i, calories: 240, unit: 'serving', quantity: /([\d.]+)\s*(?:servings?|pieces?)?\s*(?:of\s+)?chicken\b/i, skip: /adobo/i },
    { terms: /\bpork\b/i, calories: 290, unit: 'serving', quantity: /([\d.]+)\s*(?:servings?|pieces?)?\s*(?:of\s+)?pork\b/i, skip: /adobo/i },
    { terms: /\bbeef\b/i, calories: 250, unit: 'serving', quantity: /([\d.]+)\s*(?:servings?|pieces?)?\s*(?:of\s+)?beef\b/i },
    { terms: /\bfish\b/i, calories: 180, unit: 'serving', quantity: /([\d.]+)\s*(?:servings?|pieces?)?\s*(?:of\s+)?fish\b/i },
    { terms: /\bbanana\b/i, calories: 105, unit: 'piece', quantity: /([\d.]+)\s*(?:pieces?)?\s*(?:of\s+)?banana\b/i },
    { terms: /\bapple\b/i, calories: 95, unit: 'piece', quantity: /([\d.]+)\s*(?:pieces?)?\s*(?:of\s+)?apple\b/i },
    { terms: /\bbread\b/i, calories: 80, unit: 'slice', quantity: /([\d.]+)\s*slices?\s*(?:of\s+)?bread\b/i },
    { terms: /\boatmeal|oats\b/i, calories: 154, unit: 'cup', quantity: /([\d.]+)\s*cups?\s*(?:of\s+)?(?:oatmeal|oats)\b/i },
    { terms: /\b(?:pasta|noodles?)\b/i, calories: 220, unit: 'cup', quantity: /([\d.]+)\s*cups?\s*(?:of\s+)?(?:pasta|noodles?)\b/i },
    { terms: /\bpotato\b/i, calories: 160, unit: 'piece', quantity: /([\d.]+)\s*(?:pieces?)?\s*(?:of\s+)?potato\b/i },
    { terms: /\b(?:vegetables?|broccoli|carrots?)\b/i, calories: 70, unit: 'cup', quantity: /([\d.]+)\s*cups?\s*(?:of\s+)?(?:vegetables?|broccoli|carrots?)\b/i },
    { terms: /\bmilk\b/i, calories: 125, unit: 'cup', quantity: /([\d.]+)\s*cups?\s*(?:of\s+)?milk\b/i },
    { terms: /\bburger\b/i, calories: 500, unit: 'piece', quantity: /([\d.]+)\s*(?:burgers?)\b/i },
    { terms: /\bpizza\b/i, calories: 285, unit: 'slice', quantity: /([\d.]+)\s*slices?\s*(?:of\s+)?pizza\b/i },
    { terms: /\bsandwich\b/i, calories: 350, unit: 'piece', quantity: /([\d.]+)\s*(?:sandwiches?)\b/i },
    { terms: /\bsalad\b/i, calories: 150, unit: 'serving', quantity: /([\d.]+)\s*(?:servings?)?\s*(?:of\s+)?salad\b/i },
  ];

  let total = 0;
  const matched = [];
  foods.forEach((food) => {
    if (!food.terms.test(description) || food.skip?.test(description)) return;
    const quantity = description.match(food.quantity);
    const count = quantity ? Math.max(0.5, Number(quantity[1])) : 1;
    const itemCalories = Math.round(food.calories * count);
    total += itemCalories;
    matched.push(`${count} ${food.unit}${count === 1 ? '' : 's'} · ${itemCalories} kcal`);
  });
  return matched.length ? { calories: total, matched } : null;
}

export function estimateWorkoutCalories(description, weight) {
  if (!description || !weight) return null;
  const workout = description.toLowerCase();
  let calories = 0;
  const distance = workout.match(/(\d+(?:\.\d+)?)\s*(km|kilometers?|k\b|miles?|mi\b)/i);

  if (distance && /\b(run|running|jog|jogging|walk|walking)\b/.test(workout)) {
    const amount = Number(distance[1]);
    const km = /mile|\bmi\b/.test(distance[2]) ? amount * 1.609 : amount;
    const run = /\b(run|running|jog|jogging)\b/.test(workout);
    const walk = /\b(walk|walking)\b/.test(workout);
    calories += km * weight * (run && walk ? 0.8 : run ? 1 : 0.55);
  }

  if (/\b(chest|biceps?|triceps?|shoulders?|back|legs?|weights?|strength|lifting|push|pull|workout)\b/.test(workout)) {
    const duration = workout.match(/(\d+(?:\.\d+)?)\s*(?:min|minutes?)\b/i);
    calories += 5 * 3.5 * weight / 200 * (duration ? Number(duration[1]) : 30);
  }

  return calories ? Math.max(1, Math.round(calories)) : null;
}

export function calculateProfile({ age, gender, weight, height, activityLevel, deficitGoal }) {
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === 'male' ? 5 : -161;
  const tdee = Math.round(bmr * activityLevel);
  return {
    age,
    gender,
    weight,
    height,
    activityLevel,
    deficitGoal,
    bmr: Math.round(bmr),
    tdee,
    targetCalories: Math.max(0, tdee - deficitGoal),
  };
}

export function getWeekDates(date) {
  const selected = new Date(`${date}T00:00:00`);
  const mondayOffset = (selected.getDay() + 6) % 7;
  selected.setDate(selected.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(selected);
    day.setDate(selected.getDate() + index);
    return day;
  });
}

export function buildInsights(logs, profile) {
  const today = new Date();
  let loggedDays = 0;
  let intake = 0;
  let workouts = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const log = logs[dateKey(date)];
    if (!log) continue;
    if (log.calories > 0) {
      loggedDays += 1;
      intake += log.calories;
    }
    if (log.gym) workouts += 1;
  }
  if (!profile || !loggedDays) return ['Start logging meals and workouts to build your 7-day summary.'];
  const average = Math.round(intake / loggedDays);
  const difference = average - profile.targetCalories;
  const insights = [`You logged meals on ${loggedDays} of the last 7 days, averaging ${average.toLocaleString()} kcal on logged days.`];
  if (Math.abs(difference) <= 150) {
    insights.push(`Your average intake is close to your ${profile.targetCalories.toLocaleString()} kcal daily target.`);
  } else if (difference > 0) {
    insights.push(`Your average is about ${difference.toLocaleString()} kcal above your daily target. Check portions and entry estimates for accuracy.`);
  } else if (average < profile.bmr) {
    insights.push(`Your logged average is below your estimated BMR of ${profile.bmr.toLocaleString()} kcal. Your log may be incomplete; avoid making major changes without professional advice.`);
  } else {
    insights.push(`Your average is about ${Math.abs(difference).toLocaleString()} kcal below your daily target.`);
  }
  insights.push(`You logged ${workouts} workout ${workouts === 1 ? 'day' : 'days'} in the last 7 days.`);
  return insights;
}
