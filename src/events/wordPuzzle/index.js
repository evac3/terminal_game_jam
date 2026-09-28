import { addFile, docFile } from '../../game/fileSystem';
import puzzleText from './puzzle.txt?raw';

/**
 * EVENT 1: word puzzle (first major event, placeholder).
 *
 * Triggered by `event: word-puzzle` in a dialogue script. It puts puzzle.txt
 * in the player's home folder, and `view puzzle.txt` opens it in its own
 * window. The answer check (and the NPC's right/wrong replies) is in the
 * dialogue script: see the word puzzle scene in scripts/example.txt.
 */
export default {
  id: 'word-puzzle',
  name: 'Word puzzle',

  // Documents open in their own window. Key = document id.
  // `citation` (optional) is listed on the ending screen.
  documents: {
    'word-puzzle': {
      title: 'puzzle.txt',
      text: puzzleText,
      citation:
        'Terranova, M. L. (2026). From Source to Target: The Neutron Pathway for the Clinical ' +
        'Translation of Boron Neutron Capture. Journal of Nuclear Engineering, 7(1), 6. ' +
        'https://doi.org/10.3390/jne7010006',
    },
  },

  start({ session }) {
    addFile(session.fs, `${session.home}/puzzle.txt`, docFile('word-puzzle'));
  },
};
