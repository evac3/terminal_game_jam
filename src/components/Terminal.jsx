import { useEffect, useRef, useState } from 'react';
import { useTerminal, formatPrompt } from '../hooks/useTerminal';
import './Terminal.css';

/** `active` is false while another screen is shown on top (see App.jsx). */
export default function Terminal({ active = true }) {
  const { lines, prompt, sendCommand } = useTerminal();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 = not browsing history

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Keep the newest output in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  // Coming back from another screen: restore scroll position and focus.
  useEffect(() => {
    if (!active) return;
    bottomRef.current?.scrollIntoView({ block: 'end' });
    inputRef.current?.focus();
  }, [active]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendCommand(input);
      if (input.trim()) setHistory((prev) => [...prev, input]);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(next);
        setInput(history[next]);
      }
    }
  };

  return (
    <div className="terminal" hidden={!active} onClick={() => inputRef.current?.focus()}>
      {lines.map((line) => (
        <div key={line.id} className={`terminal-line terminal-line--${line.kind}`}>
          {line.text}
        </div>
      ))}

      <div className="terminal-input-row" ref={bottomRef}>
        <span className="terminal-prompt">{formatPrompt(prompt)}</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
