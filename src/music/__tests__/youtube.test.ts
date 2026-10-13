import { parseYoutubeLink } from '../youtube';

describe('parseYoutubeLink', () => {
  const LIST = 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG';

  it('reconnaît une playlist', () => {
    expect(parseYoutubeLink(`https://www.youtube.com/playlist?list=${LIST}`)).toEqual({
      kind: 'playlist',
      id: LIST,
      url: `https://www.youtube.com/playlist?list=${LIST}`,
    });
  });

  it('accepte les liens mobiles, YouTube Music et sans https', () => {
    expect(parseYoutubeLink(`m.youtube.com/playlist?list=${LIST}`)?.id).toBe(LIST);
    expect(parseYoutubeLink(`https://music.youtube.com/playlist?list=${LIST}&si=abc`)?.id).toBe(LIST);
  });

  it('préfère la playlist quand le lien d’une vidéo en contient une', () => {
    const link = parseYoutubeLink(`https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${LIST}`);
    expect(link?.kind).toBe('playlist');
    expect(link?.id).toBe(LIST);
  });

  it('reconnaît une vidéo seule, y compris en lien court', () => {
    expect(parseYoutubeLink('https://youtu.be/dQw4w9WgXcQ?t=3')).toEqual({
      kind: 'video',
      id: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    expect(parseYoutubeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.kind).toBe('video');
  });

  it('refuse tout ce qui n’est pas YouTube', () => {
    expect(parseYoutubeLink('')).toBeNull();
    expect(parseYoutubeLink('   ')).toBeNull();
    expect(parseYoutubeLink('bonjour')).toBeNull();
    expect(parseYoutubeLink(`https://evil.example.com/playlist?list=${LIST}`)).toBeNull();
    expect(parseYoutubeLink(`https://youtube.com.evil.example/playlist?list=${LIST}`)).toBeNull();
    expect(parseYoutubeLink('https://www.youtube.com/')).toBeNull();
    expect(parseYoutubeLink('javascript:alert(1)')).toBeNull();
  });
});
