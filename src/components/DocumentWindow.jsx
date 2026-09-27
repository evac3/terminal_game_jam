import { useEffect } from 'react';
import { getDocument } from '../events';
import './DocumentWindow.css';

/** A document (from an event's `documents`) shown in its own window. Opened by `view`. */
export default function DocumentWindow({ id }) {
  const doc = getDocument(id);

  useEffect(() => {
    document.title = doc?.title ?? 'Unknown document';
  }, [doc]);

  if (!doc) return <p className="doc-missing">Unknown document: {id}</p>;

  return (
    <div className="doc-window">
      <header className="doc-header">
        <span>{doc.title}</span>
        <button onClick={() => window.close()}>Close</button>
      </header>
      <pre className="doc-text">{doc.text}</pre>
    </div>
  );
}
