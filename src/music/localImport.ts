import { Directory, File, Paths } from 'expo-file-system';
import { uid } from '../domain/id';
import { isVideoFile, titleFromFileName } from './localTracks';
import type { LocalTrack } from './types';

const FOLDER = 'music';

/**
 * Ouvre le sélecteur de fichiers du téléphone, puis copie les fichiers choisis dans le dossier de l'application :
 * la musique reste disponible même si le fichier d'origine est déplacé.
 */
export const importMusicFiles = async (): Promise<LocalTrack[]> => {
  const picked = await File.pickFileAsync({ mimeTypes: ['audio/*', 'video/mp4'], multipleFiles: true });
  if (picked.canceled) return [];

  const directory = new Directory(Paths.document, FOLDER);
  directory.create({ intermediates: true, idempotent: true });

  const imported: LocalTrack[] = [];
  for (const file of picked.result) {
    const id = uid();
    const destination = new File(directory, `${id}${file.extension || ''}`);
    try {
      await file.copy(destination, { overwrite: true });
    } catch {
      continue;
    }
    imported.push({
      id,
      name: titleFromFileName(file.name),
      uri: destination.uri,
      kind: isVideoFile(file.name, file.type) ? 'video' : 'audio',
    });
  }
  return imported;
};

/** Supprime la copie d'un fichier importé (sans effet si elle a déjà disparu). */
export const deleteImportedFile = (track: LocalTrack): void => {
  try {
    const file = new File(track.uri);
    if (file.exists) file.delete();
  } catch {
    // la copie n'existe plus : rien à nettoyer
  }
};
