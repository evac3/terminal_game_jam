import { images } from './images';
import { events } from './events';

/**
 * Every citation in the game, for the ending screen:
 * [{ source: 'image.jpg', text }, ...]. Collected from images
 * (src/images/index.js) and event documents (src/events/*), so adding a
 * `citation` there is all it takes.
 */
export function getCitations() {
  const list = [];
  for (const image of Object.values(images)) {
    if (image.citation) list.push({ source: image.title, text: image.citation });
  }
  for (const event of Object.values(events)) {
    for (const doc of Object.values(event.documents ?? {})) {
      if (doc.citation) list.push({ source: doc.title, text: doc.citation });
    }
  }
  return list;
}
