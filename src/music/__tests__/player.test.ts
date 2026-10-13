import { Linking } from 'react-native';
import {
  beginSessionMusic,
  nextTrack,
  openExternalMusic,
  previousTrack,
  selectCurrentTrack,
  startQueue,
  stopMusic,
  togglePlayback,
  usePlayer,
} from '../player';
import type { Track } from '../types';

jest.mock('expo-audio', () => {
  const fake = {
    currentTime: 0,
    handler: null as null | ((status: unknown) => void),
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(async () => undefined),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    clearLockScreenControls: jest.fn(),
    addListener: jest.fn((_event: string, handler: (status: unknown) => void) => {
      fake.handler = handler;
      return { remove: jest.fn() };
    }),
  };
  return {
    __fake: fake,
    createAudioPlayer: jest.fn(() => fake),
    setAudioModeAsync: jest.fn(async () => undefined),
  };
});

type Fake = {
  currentTime: number;
  handler: null | ((status: unknown) => void);
  replace: jest.Mock;
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
  seekTo: jest.Mock;
  setActiveForLockScreen: jest.Mock;
  updateLockScreenMetadata: jest.Mock;
  clearLockScreenControls: jest.Mock;
};

const audio = jest.requireMock('expo-audio') as {
  __fake: Fake;
  createAudioPlayer: jest.Mock;
  setAudioModeAsync: jest.Mock;
};
const fake = audio.__fake;

const track = (n: number): Track => ({
  id: `t${n}`,
  title: `Titre ${n}`,
  artist: `Artiste ${n}`,
  uri: `https://audio.example/${n}.mp3`,
  durationSec: 200,
  artwork: `https://img.example/${n}.jpg`,
  source: 'jamendo',
});

const status = (patch: Record<string, unknown> = {}) => ({
  playing: false,
  isLoaded: true,
  isBuffering: false,
  didJustFinish: false,
  error: null,
  ...patch,
});

const emit = (patch: Record<string, unknown>) => fake.handler?.(status(patch));

let clock = 1_000_000;
/** fait avancer l'horloge : les signaux reçus juste après le chargement d'un titre sont ignorés */
const wait = (ms: number) => {
  clock += ms;
};

const lastUri = (): string => (fake.replace.mock.calls[fake.replace.mock.calls.length - 1][0] as { uri: string }).uri;

const begin = async (count = 3) => {
  beginSessionMusic('s1', 'Playlist de la séance');
  await startQueue(Array.from({ length: count }, (_, i) => track(i + 1)), 'Playlist de la séance');
};

beforeEach(() => {
  clock = 1_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => clock);
  stopMusic();
  jest.clearAllMocks();
  fake.handler = null;
  fake.currentTime = 0;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('lecteur', () => {
  it('prépare la lecture en arrière-plan et sur l’écran verrouillé', async () => {
    await begin();
    expect(audio.setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    expect(fake.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { title: 'Titre 1', artist: 'Artiste 1', albumTitle: 'Cadence', artworkUrl: 'https://img.example/1.jpg' },
      { showSeekForward: false, showSeekBackward: false },
    );
    expect(lastUri()).toBe('https://audio.example/1.mp3');
    expect(fake.play).toHaveBeenCalledTimes(1);
    expect(usePlayer.getState().status).toBe('loading');

    emit({ playing: true });
    expect(usePlayer.getState().status).toBe('playing');
    expect(selectCurrentTrack(usePlayer.getState())?.title).toBe('Titre 1');
  });

  it('ne démarre rien avec une liste vide', async () => {
    beginSessionMusic('s1', 'Mes fichiers');
    await startQueue([], 'Mes fichiers');
    expect(audio.createAudioPlayer).not.toHaveBeenCalled();
  });

  it('enchaîne les titres et revient au premier à la fin de la liste', async () => {
    await begin();
    emit({ playing: true });

    wait(200_000);
    emit({ didJustFinish: true });
    expect(lastUri()).toBe('https://audio.example/2.mp3');
    expect(usePlayer.getState().index).toBe(1);
    expect(fake.updateLockScreenMetadata).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Titre 2' }));

    wait(200_000);
    emit({ didJustFinish: true });
    expect(lastUri()).toBe('https://audio.example/3.mp3');
    expect(usePlayer.getState().index).toBe(2);

    wait(200_000);
    emit({ didJustFinish: true });
    expect(lastUri()).toBe('https://audio.example/1.mp3');
    expect(usePlayer.getState().index).toBe(0);
  });

  it('ne saute pas deux titres quand la fin est signalée plusieurs fois', async () => {
    await begin();
    wait(200_000);
    emit({ didJustFinish: true });
    emit({ didJustFinish: true });
    emit({ didJustFinish: true });
    expect(usePlayer.getState().index).toBe(1);
    expect(fake.replace).toHaveBeenCalledTimes(2);
  });

  it('passe au titre suivant quand un titre est illisible', async () => {
    await begin();
    wait(3000);
    emit({ error: 'Source error' });
    expect(usePlayer.getState().index).toBe(1);
    expect(lastUri()).toBe('https://audio.example/2.mp3');
    emit({ error: 'Source error' });
    expect(usePlayer.getState().index).toBe(1);
    emit({ playing: true });
    expect(usePlayer.getState().message).toBeNull();
  });

  it('s’arrête sur un message quand aucun titre n’est lisible', async () => {
    await begin(2);
    wait(3000);
    emit({ error: 'Source error' });
    wait(3000);
    emit({ error: 'Source error' });
    const state = usePlayer.getState();
    expect(state.status).toBe('paused');
    expect(state.message).toMatch(/Impossible de lire/);
    expect(fake.pause).toHaveBeenCalled();
  });

  it('met en pause puis reprend', async () => {
    await begin();
    emit({ playing: true });
    togglePlayback();
    expect(fake.pause).toHaveBeenCalledTimes(1);
    expect(usePlayer.getState().status).toBe('paused');
    fake.play.mockClear();
    togglePlayback();
    expect(fake.play).toHaveBeenCalledTimes(1);
    expect(usePlayer.getState().status).toBe('playing');
  });

  it('suit la pause demandée depuis l’écran verrouillé', async () => {
    await begin();
    emit({ playing: true });
    wait(5000);
    emit({ playing: false });
    expect(usePlayer.getState().status).toBe('paused');
  });

  it('affiche « chargement » plutôt que « pause » juste après un changement de titre', async () => {
    await begin();
    emit({ playing: true });
    nextTrack();
    emit({ playing: false });
    expect(usePlayer.getState().status).toBe('loading');
  });

  it('suivant et précédent bouclent sur la liste', async () => {
    await begin();
    nextTrack();
    nextTrack();
    nextTrack();
    expect(usePlayer.getState().index).toBe(0);
    previousTrack();
    expect(usePlayer.getState().index).toBe(2);
  });

  it('« précédent » recommence le titre déjà bien entamé', async () => {
    await begin();
    nextTrack();
    fake.currentTime = 42;
    previousTrack();
    expect(fake.seekTo).toHaveBeenCalledWith(0);
    expect(usePlayer.getState().index).toBe(1);
  });

  it('libère tout à l’arrêt', async () => {
    await begin();
    emit({ playing: true });
    stopMusic();
    expect(fake.clearLockScreenControls).toHaveBeenCalled();
    expect(fake.remove).toHaveBeenCalled();
    const state = usePlayer.getState();
    expect(state.status).toBe('idle');
    expect(state.queue).toEqual([]);
    expect(state.sessionId).toBeNull();
  });

  it('ignore une liste qui arrive après l’arrêt', async () => {
    beginSessionMusic('s1', 'Playlist de la séance');
    const pending = startQueue([track(1)], 'Playlist de la séance');
    stopMusic();
    await pending;
    expect(usePlayer.getState().queue).toEqual([]);
    expect(fake.replace).not.toHaveBeenCalled();
  });
});

describe('application musicale externe', () => {
  it('ouvre le lien et garde de quoi le rouvrir', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    beginSessionMusic('s1', 'Spotify');
    await openExternalMusic('Spotify', 'https://open.spotify.com/search/x/playlists');
    expect(open).toHaveBeenCalledWith('https://open.spotify.com/search/x/playlists');
    const state = usePlayer.getState();
    expect(state.external).toEqual({ label: 'Spotify', url: 'https://open.spotify.com/search/x/playlists' });
    expect(state.sessionId).toBe('s1');
    expect(state.message).toBeNull();
  });

  it('prévient quand l’application ne s’ouvre pas', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    beginSessionMusic('s1', 'Deezer');
    await openExternalMusic('Deezer', 'https://www.deezer.com/search/x/playlist');
    expect(usePlayer.getState().message).toBe('Impossible d’ouvrir Deezer.');
  });

  it('coupe la lecture interne quand on passe à une application externe', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await begin();
    await openExternalMusic('Spotify', 'https://open.spotify.com/search/x/playlists');
    expect(fake.remove).toHaveBeenCalled();
    expect(usePlayer.getState().queue).toEqual([]);
  });
});
