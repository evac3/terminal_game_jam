import wordPuzzle from './wordPuzzle';

/**
 * Game events. Each event lives in its own folder and exports:
 *
 *   {
 *     id: 'word-puzzle',            // used by `event: <id>` in dialogue scripts
 *     name: 'Word puzzle',
 *     documents: { <docId>: { title, text } },   // optional, opened by `view`
 *     start({ session, terminal }) { ... },      // runs when the event fires
 *   }
 *
 * To add an event: make a folder next to wordPuzzle/, then list it here.
 */
const ALL_EVENTS = [wordPuzzle];

export const events = Object.fromEntries(ALL_EVENTS.map((e) => [e.id, e]));

export function getEvent(id) {
  return events[id] ?? null;
}

/** Find a document by id across all events. */
export function getDocument(id) {
  for (const event of ALL_EVENTS) {
    if (event.documents?.[id]) return event.documents[id];
  }
  return null;
}

export function runEvent(id, ctx) {
  const event = getEvent(id);
  if (!event) throw new Error(`unknown event "${id}"`);
  event.start(ctx);
}
