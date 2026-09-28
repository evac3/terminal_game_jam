import placeholder from './image.webp';

/**
 * Images the player can open with `view`. Key = image id, used by
 * imageFile('<id>') in src/game/fileSystem.js. `citation` (optional) is
 * listed on the ending screen.
 *
 * To add an image: put the file in this folder, import it here, and add an entry.
 * To replace the image: overwrite image.webp (keep the name) or change the import.
 */
export const images = {
  placeholder: {
    title: 'image.webp',
    src: placeholder,
    citation: 'Van Rooyen, Theunis. (2020). Nuclear Physics for Nuclear Engineers.',
  },
};

export function getImage(id) {
  return images[id] ?? null;
}
