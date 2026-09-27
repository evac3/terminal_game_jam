/**
 * Plays a list of parsed steps (see parser.js).
 *
 * It runs `say` steps one after another until it reaches an `input` step, then
 * waits until submit() gets a matching key press or keyword.
 *
 * Callbacks:
 *   say(target, text)   print a line ('main' or 'npc')
 *   event(id)           a game event fires (`event:` line)
 *   wait(options)       now waiting on these input options
 *   end()               the script finished
 */

/** Does player input { key } or { text } satisfy one input option? */
export function matchesOption(option, input) {
  if (option.kind === 'key') {
    if (input.key == null) return false;
    if (option.key === '*') return true;
    const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
    return key === option.key;
  }
  return input.text != null && input.text.trim().toLowerCase() === option.word;
}

export class DialogueRunner {
  constructor(steps, { say, event, wait, end }) {
    this.steps = steps;
    this.callbacks = { say, event, wait, end };
    this.index = 0;
    this.done = false;
  }

  start() {
    this.index = 0;
    this.done = false;
    this.#advance();
  }

  get #inputStep() {
    const step = this.steps[this.index];
    return !this.done && step?.type === 'input' ? step : null;
  }

  /** The options being waited on, or null. */
  get waitingFor() {
    return this.#inputStep?.options ?? null;
  }

  /** NPC replies for a wrong typed answer (`wrong:` lines), or []. */
  get wrongReplies() {
    return this.#inputStep?.wrong ?? [];
  }

  /**
   * input: { key } or { text, from: 'main' | 'npc' }. A typed answer only
   * counts from the screen named in `input npc [...]` / `input main [...]`.
   */
  accepts(input) {
    const step = this.#inputStep;
    if (!step) return false;
    if (input.text != null && step.from && input.from !== step.from) return false;
    return step.options.some((option) => matchesOption(option, input));
  }

  /**
   * Continue if `input` matches. Pass `atStep` to only continue if the runner
   * is still at that step (guards against one key press advancing twice).
   */
  submit(input, atStep = this.index) {
    if (atStep !== this.index || !this.accepts(input)) return false;
    this.index++;
    this.#advance();
    return true;
  }

  #advance() {
    while (this.index < this.steps.length) {
      const step = this.steps[this.index];
      if (step.type === 'input') {
        this.callbacks.wait(step.options);
        return;
      }
      if (step.type === 'say') this.callbacks.say(step.target, step.text);
      if (step.type === 'event') this.callbacks.event(step.id);
      this.index++;
    }
    this.done = true;
    this.callbacks.end();
  }
}
