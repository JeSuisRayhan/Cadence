import { externalLabel, externalQuery, externalSearchUrl } from '../external';
import { genreLabels } from '../genres';

describe('applications musicales', () => {
  it('cherche les styles choisis suivis de « workout »', () => {
    expect(externalQuery(['hiphop', 'electro'])).toBe('hip hop electro workout');
    expect(externalQuery(['afro'])).toBe('afrobeats workout');
  });

  it('construit l’adresse de recherche de chaque application', () => {
    const genres = ['hiphop', 'electro'] as const;
    expect(externalSearchUrl('spotify', genres)).toBe('https://open.spotify.com/search/hip%20hop%20electro%20workout/playlists');
    expect(externalSearchUrl('youtubemusic', genres)).toBe('https://music.youtube.com/search?q=hip%20hop%20electro%20workout');
    expect(externalSearchUrl('deezer', genres)).toBe('https://www.deezer.com/search/hip%20hop%20electro%20workout/playlist');
    expect(externalSearchUrl('applemusic', genres)).toBe('https://music.apple.com/search?term=hip%20hop%20electro%20workout');
  });

  it('donne un nom lisible à chaque application et à chaque style', () => {
    expect(externalLabel('youtubemusic')).toBe('YouTube Music');
    expect(genreLabels(['hiphop', 'electro', 'lofi'])).toBe('Hip-hop, Électro, Lo-fi');
  });
});
