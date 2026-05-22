/**
 * Adds niche social / fun acts (games and hangouts with friends).
 * Each act ends with taking a picture together afterward.
 *
 * Run: node scripts/add-niche-social-tasks.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), 'task-catalog-seed.json');

const PHOTO =
  "When you are done, take a picture together afterward and save it as your act memory (faces only with everyone's permission).";

function withPhoto(body) {
  return `${body.trim()} ${PHOTO}`;
}

const NEW_TASKS = [
  {
    taskId: 'task_0000065',
    cadence: 'daily',
    textShort: "Do today's Wordle or Connections with someone—and take a picture together after!",
    textLong: withPhoto(
      'Ask a friend, classmate, or willing stranger in a public place if they want to solve today’s NYT Wordle or Connections on one phone. Work through it together—no spoilers for people not playing.',
    ),
    category: 'community',
    difficulty: 2,
    minAge: 10,
    traits: ['Extrovert'],
    materials: ['Phone'],
    picture: true,
    sortKey: 420,
  },
  {
    taskId: 'task_0000066',
    cadence: 'weekly',
    textShort: 'Play one round of GeoGuessr together—and take a picture together after!',
    textLong:
      'Open GeoGuessr (or a similar map quiz) and pass one phone back and forth with a friend or someone willing to play for five minutes. Guess together, react to the reveal, then take a picture together afterward.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 10,
    traits: ['Any'],
    materials: ['Phone'],
    picture: true,
    sortKey: 419,
  },
  {
    taskId: 'task_0000067',
    cadence: 'daily',
    textShort: 'Rock–paper–scissors best-of-three with someone new—and take a picture together after!',
    textLong:
      'Challenge someone you do not know well—at school, work, or in line—to a quick best-of-three rock–paper–scissors. Keep it light; if they say no, thank them and try someone else. Winner gets nothing except bragging rights; loser owes a genuine compliment. Take a picture together afterward.' +
      PHOTO,
    category: 'community',
    difficulty: 1,
    minAge: 6,
    traits: ['Extrovert'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 418,
  },
  {
    taskId: 'task_0000068',
    cadence: 'weekly',
    textShort: 'Play two truths and a lie with someone new—and take a picture together after!',
    textLong:
      'Find a classmate, coworker, or acquaintance you rarely talk to. Each share two true facts and one lie; the other guesses the lie. Swap roles once. Take a picture together afterward.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 10,
    traits: ['Extrovert'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 417,
  },
  {
    taskId: 'task_0000069',
    cadence: 'weekly',
    textShort: 'Play 20 questions about their hobby—and take a picture together after!',
    textLong:
      'Ask someone to pick a hobby or interest you do not know much about. You get up to 20 yes-or-no questions to guess it. When you figure it out (or run out of questions), let them tell you one fun fact about it. Take a picture together afterward.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 8,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 416,
  },
  {
    taskId: 'task_0000070',
    cadence: 'weekly',
    textShort: 'Pass a phone around and build a one-sentence story—and take a picture together after!',
    textLong:
      'With three or more people at lunch or hanging out, open Notes and add one sentence each, passing the phone around until the story feels complete (at least four sentences). Read it aloud together, then take a picture together afterward.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 10,
    traits: ['Any'],
    materials: ['Phone'],
    picture: true,
    sortKey: 415,
  },
  {
    taskId: 'task_0000071',
    cadence: 'daily',
    textShort: "Order the barista's favorite drink—and take a picture together after!",
    textLong:
      'At a café, ask the barista what they would order for themselves today (or their off-menu favorite). Order it if you can, thank them by name if they shared it, and tip if possible. Ask if they are okay being in a photo; if not, take a picture of your cups together on the counter and include them only with permission. Take a picture together afterward.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 12,
    traits: ['Any'],
    materials: ['Money optional'],
    picture: true,
    sortKey: 414,
  },
  {
    taskId: 'task_0000072',
    cadence: 'weekly',
    textShort: 'Pantry cook-off with someone you live with—and take a picture together after!',
    textLong:
      'Pick five ingredients you both already have at home. Set a 20-minute timer and each make a small plate for the other. Taste-test, pick a silly “judge’s favorite,” then take a picture together afterward with both plates in frame.' +
      PHOTO,
    category: 'general',
    difficulty: 2,
    minAge: 10,
    traits: ['Chef'],
    materials: ['Food'],
    picture: true,
    sortKey: 413,
  },
  {
    taskId: 'task_0000073',
    cadence: 'daily',
    textShort: 'Snack trade at lunch with someone new—and take a picture together after!',
    textLong:
      'Sit with or walk over to someone you do not usually eat with. Offer to trade one snack item (sealed or clearly yours). If they decline, offer a friendly chat instead—no pressure. Take a picture together afterward showing what you traded or shared.' +
      PHOTO,
    category: 'community',
    difficulty: 1,
    minAge: 6,
    traits: ['Any'],
    materials: ['Snack'],
    picture: true,
    sortKey: 412,
  },
  {
    taskId: 'task_0000074',
    cadence: 'weekly',
    textShort: 'Blind tea or coffee taste-test for two—and take a picture together after!',
    textLong:
      'Make three small cups of tea or coffee at home for someone you live with (or invite a friend over). Blindfold or look away while tasting; rank them together. Take a picture together afterward with the winning cup.' +
      PHOTO,
    category: 'general',
    difficulty: 2,
    minAge: 10,
    traits: ['Chef'],
    materials: ['Food'],
    picture: true,
    sortKey: 411,
  },
  {
    taskId: 'task_0000075',
    cadence: 'weekly',
    textShort: 'Play UNO with someone sitting alone—and take a picture together after!',
    textLong:
      'Bring a deck of UNO or a simple card game to lunch or study hall. Ask one person sitting alone if they want a quick round—respect a no. Play until one game finishes, then take a picture together afterward (cards or hands in frame is fine if faces are not okay).' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 8,
    traits: ['Extrovert'],
    materials: ['Cards'],
    picture: true,
    sortKey: 410,
  },
  {
    taskId: 'task_0000076',
    cadence: 'weekly',
    textShort: 'Compliment the person on your left in a friend group—and take a picture together after!',
    textLong:
      'With at least three friends, go around once: everyone gives one specific, kind compliment to the person on their left (no body shaming, no backhanded jokes). After the round, take a picture together afterward as a group.' +
      PHOTO,
    category: 'emotional',
    difficulty: 1,
    minAge: 10,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 409,
  },
  {
    taskId: 'task_0000077',
    cadence: 'weekly',
    textShort: 'Teach each other a 30-second dance move—and take a picture together after!',
    textLong:
      'With a friend, each teach the other one short dance move (from a video, sport warmup, or silly freestyle). Practice until you can do both in a row. Film only what everyone agrees to share; take a picture together afterward capturing the attempt.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 10,
    traits: ['Any'],
    materials: ['Phone optional'],
    picture: true,
    sortKey: 408,
  },
  {
    taskId: 'task_0000078',
    cadence: 'weekly',
    textShort: 'Mini scavenger hunt with a friend—and take a picture together after!',
    textLong:
      'Agree on a 10-minute list (e.g. something blue, something funny, something older than you, something that feels like kindness). Hunt together in a mall, campus, or neighborhood. Take a picture together afterward with your favorite find.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 8,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 407,
  },
  {
    taskId: 'task_0000079',
    cadence: 'monthly',
    textShort: 'Voice-note-only day with friends—and take a picture together after!',
    textLong:
      'With two or three close friends, pick one day where your group chat is voice memos only—no text. Check in, joke, encourage. At the end of the day, meet up or jump on a call and take a picture together afterward (or a selfie on a video call if you are far apart).' +
      PHOTO,
    category: 'emotional',
    difficulty: 2,
    minAge: 12,
    traits: ['Any'],
    materials: ['Phone'],
    picture: true,
    sortKey: 406,
  },
  {
    taskId: 'task_0000080',
    cadence: 'weekly',
    textShort: 'Host a local multiplayer game night—and take a picture together after!',
    textLong:
      'Invite a friend over (or use a shared screen) for one session of Mario Kart, Jackbox, or any same-room multiplayer game. If a guest wins, they pick the next round. Take a picture together afterward with the score screen or controllers in frame.' +
      PHOTO,
    category: 'community',
    difficulty: 1,
    minAge: 8,
    traits: ['Any'],
    materials: ['Phone or console'],
    picture: true,
    sortKey: 405,
  },
  {
    taskId: 'task_0000081',
    cadence: 'weekly',
    textShort: 'Teach a relative one phone trick they wanted—and take a picture together after!',
    textLong:
      'Ask a parent, grandparent, or older relative what one phone thing confuses them—shared albums, Wordle, focus mode, photos backup. Walk them through it until they do one step solo. Take a picture together afterward.' +
      PHOTO,
    category: 'general',
    difficulty: 2,
    minAge: 10,
    traits: ['Any'],
    materials: ['Phone'],
    picture: true,
    sortKey: 404,
  },
  {
    taskId: 'task_0000082',
    cadence: 'monthly',
    textShort: 'Interview a grandparent or elder relative—and take a picture together after!',
    textLong:
      'Ask five questions: childhood memory, proudest moment, best advice, funniest family story, and what kindness means to them. Listen without interrupting. Take a picture together afterward—you can hold a quote card you wrote from their answer.' +
      PHOTO,
    category: 'emotional',
    difficulty: 2,
    minAge: 10,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 403,
  },
  {
    taskId: 'task_0000083',
    cadence: 'monthly',
    textShort: 'Family show-and-tell night—and take a picture together after!',
    textLong:
      'Get everyone at home to bring one object with a 60-second story. No interrupting during stories. After the last story, take a picture together afterward with all the objects on the table.' +
      PHOTO,
    category: 'general',
    difficulty: 1,
    minAge: 6,
    traits: ['Any'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 402,
  },
  {
    taskId: 'task_0000084',
    cadence: 'weekly',
    textShort: 'Play chess or checkers in the park—and take a picture together after!',
    textLong:
      'Bring a board or use a park table with a built-in board. Ask one person if they want a quick game—set a 15-minute cap and respect a no. Play best you can, shake hands or fist-bump after, then take a picture together afterward with the board.' +
      PHOTO,
    category: 'community',
    difficulty: 3,
    minAge: 12,
    traits: ['Extrovert'],
    materials: ['Board game optional'],
    picture: true,
    sortKey: 401,
  },
  {
    taskId: 'task_0000085',
    cadence: 'daily',
    textShort: 'Give a compliment and ask about their week—and take a picture together after!',
    textLong:
      'With a stranger or acquaintance in a safe public place, offer one genuine compliment, then ask: “What was the best part of your week?” Listen for at least a minute without looking at your phone. If they are open to it, take a picture together afterward; if not, take a photo with a friend who witnessed the moment instead.' +
      PHOTO,
    category: 'community',
    difficulty: 2,
    minAge: 12,
    traits: ['Extrovert'],
    materials: ['Nothing'],
    picture: true,
    sortKey: 400,
  },
  {
    taskId: 'task_0000086',
    cadence: 'daily',
    textShort: 'Swap “song of the day” with someone—and take a picture together after!',
    textLong:
      'In person or on a call, each play 30 seconds of a song that matches your mood today. Explain why you picked it. Take a picture together afterward—screenshot both album covers side by side, or a selfie while listening.' +
      PHOTO,
    category: 'emotional',
    difficulty: 1,
    minAge: 10,
    traits: ['Any'],
    materials: ['Phone'],
    picture: true,
    sortKey: 399,
  },
];

const raw = readFileSync(SEED_PATH, 'utf8');
const entries = JSON.parse(raw);
const existingIds = new Set(entries.map((e) => e.taskId));

const toAdd = NEW_TASKS.filter((t) => {
  if (existingIds.has(t.taskId)) {
    console.log(`Skip ${t.taskId} (already in seed)`);
    return false;
  }
  return true;
}).map((t) => ({ ...t, active: true }));

const out = [...toAdd, ...entries].sort((a, b) => b.sortKey - a.sortKey);
writeFileSync(SEED_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`Added ${toAdd.length} acts. Total entries: ${out.length}.`);
