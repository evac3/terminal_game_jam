import { useEffect } from 'react';
import { getImage } from '../images';
import './DocumentWindow.css';

/** An image (from src/images) shown in its own window. Opened by `view` on an image file. */
export default function ImageWindow({ id }) {
  const image = getImage(id);

  useEffect(() => {
    document.title = image?.title ?? 'Unknown image';
  }, [image]);

  if (!image) return <p className="doc-missing">Unknown image: {id}</p>;

  return (
    <div className="doc-window">
      <header className="doc-header">
        <span>{image.title}</span>
        <button onClick={() => window.close()}>Close</button>
      </header>
      <img className="doc-image" src={image.src} alt={image.title} />
    </div>
  );
}
