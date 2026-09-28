import { useEffect, useRef, useState } from 'react';
import { useDialogue } from '../dialogue/DialogueContext';
import './NpcScreen.css';

/**
 * Shows the conversation so far (earlier conversations too): `npc:` lines,
 * `player:` lines and the player's typed replies, plus an input line when a
 * keyword is expected.
 */
export default function NpcScreen() {
  const { npcLines, waitingFor, waitingFrom, reply } = useDialogue();
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const expectsText = waitingFor?.some((o) => o.kind === 'text') ?? false;
  // `input main [...]`: the answer is a terminal command, so no reply box here.
  const wantsText = expectsText && waitingFrom !== 'main';
  const wantsTerminal = expectsText && waitingFrom === 'main';
  const keyLabels = waitingFor?.filter((o) => o.kind === 'key').map((o) => o.label) ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [npcLines, waitingFor]);

  useEffect(() => {
    if (wantsText) inputRef.current?.focus();
  }, [wantsText]);

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    reply(text);
    setText('');
  };

  return (
    <div className="npc-screen" onClick={() => inputRef.current?.focus()}>
      <div className="npc-log">
        {npcLines.length === 0 && <div className="npc-line npc-line--empty">No messages yet.</div>}
        {npcLines.map((line) =>
          line.kind === 'divider' ? (
            <hr key={line.id} className="npc-divider" />
          ) : (
            <div key={line.id} className={`npc-line npc-line--${line.kind}`}>
              {line.text}
            </div>
          )
        )}

        {wantsText && (
          <div className="npc-input-row">
            <span>&gt;</span>
            <input
              ref={inputRef}
              className="npc-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        )}
        {wantsTerminal && <div className="npc-hint">[ press 1 to go to the terminal ]</div>}
        {keyLabels.length > 0 && !expectsText && (
          <div className="npc-hint">[ press {keyLabels.join(' / ')} ]</div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="npc-footer">[1] back to terminal</div>
    </div>
  );
}
