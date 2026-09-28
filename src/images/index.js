import placeholder from './image.jpg';

/**
 * Images the player can open with `view`. Key = image id, used by
 * imageFile('<id>') in src/game/fileSystem.js.
 *
 * To add an image: put the file in this folder, import it here, and add an entry.
 * To replace the placeholder: overwrite image.jpg (keep the name) or change the import.
 */
export const images = {
  placeholder: { title: 'image.jpg', src: placeholder },
};

export function getImage(id) {
  return images[id] ?? null;
}
