import axios from 'axios';
import { demoSongs, demoArtists, demoPlaylists, demoConcertsMap, defaultConcerts } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getMockResponse(url: string, method: string, cfg: any): any {
  const deviceId = cfg?.headers?.['x-device-id'] || cfg?.headers?.['X-Device-Id'] || 'demo-device';

  // POST /users
  if (url === '/users' && method === 'post') {
    return { _id: 'demo-user-melodix' };
  }

  // POST /songs/recognize
  if (url.includes('/songs/recognize')) {
    const song = demoSongs[Math.floor(Math.random() * demoSongs.length)];
    return { _id: song._id, title: song.title, artist: song.artist, cover_art_url: song.cover_art_url, youtube: song.youtube };
  }

  // GET /songs/top/popular
  if (url === '/songs/top/popular') {
    return { top_songs: demoSongs };
  }

  // GET /songs/:id
  const songMatch = url.match(/^\/songs\/([^/]+)$/);
  if (songMatch) {
    const song = demoSongs.find(s => s._id === songMatch[1]) || demoSongs[0];
    return song;
  }

  // GET /playlists/for-you
  if (url === '/playlists/for-you') {
    return {
      data: demoPlaylists.map(p => ({
        _id: p._id,
        playlist_name: p.playlist_name,
        song_count: p.tracks.length,
        cover_images: p.tracks.slice(0, 4).map((t: any) => t.cover_art_url),
      })),
    };
  }

  // GET /playlists/all
  if (url === '/playlists/all') {
    return {
      data: demoPlaylists.map(p => ({ ...p, ownerId: deviceId, deviceIds: [deviceId] })),
    };
  }

  // POST /playlists/create
  if (url === '/playlists/create' && method === 'post') {
    let body = cfg?.data;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    return { data: { _id: `playlist_new_${Date.now()}`, playlist_name: body?.playlistName || 'New Playlist' } };
  }

  // GET /playlists/:id
  const playlistMatch = url.match(/^\/playlists\/([^/]+)$/);
  if (playlistMatch && method === 'get') {
    const playlist = demoPlaylists.find(p => p._id === playlistMatch[1]) || demoPlaylists[0];
    return { data: { ...playlist, ownerId: deviceId, deviceIds: [deviceId] } };
  }

  // PUT /playlists/:id (add song)
  if (playlistMatch && method === 'put') {
    return { message: 'Song added to playlist' };
  }

  // DELETE /playlists/:id
  if (playlistMatch && method === 'delete') {
    return { message: 'Playlist deleted' };
  }

  // DELETE /playlists/:id/leave
  if (url.match(/^\/playlists\/[^/]+\/leave$/) && method === 'delete') {
    return { message: 'Left playlist' };
  }

  // POST /playlists/:id/share
  if (url.match(/^\/playlists\/[^/]+\/share$/) && method === 'post') {
    return { message: 'Joined playlist' };
  }

  // DELETE /playlists/:id/songs/:songId
  if (url.match(/^\/playlists\/[^/]+\/songs\/[^/]+$/) && method === 'delete') {
    return { message: 'Song removed from playlist' };
  }

  // GET /users/search-history
  if (url === '/users/search-history' && method === 'get') {
    return { search_history: demoSongs };
  }

  // DELETE /users/search-history (clear all)
  if (url === '/users/search-history' && method === 'delete') {
    return { message: 'History cleared' };
  }

  // DELETE /users/search-history/:id
  if (url.match(/^\/users\/search-history\/[^/]+$/) && method === 'delete') {
    return { message: 'Item deleted' };
  }

  // GET /users/artists-from-history
  if (url === '/users/artists-from-history') {
    return { artists: demoArtists };
  }

  // GET /artists/:id/concerts
  const concertsMatch = url.match(/^\/artists\/([^/]+)\/concerts$/);
  if (concertsMatch) {
    const artistId = concertsMatch[1];
    const artist = demoArtists.find(a => a._id === artistId) || { ...demoArtists[0], _id: artistId };
    const concerts = demoConcertsMap[artistId] || defaultConcerts;
    return { artist, concerts };
  }

  return { data: null };
}

function setupMockAdapter(axiosInstance: ReturnType<typeof axios.create>) {
  axiosInstance.interceptors.request.use((config: any) => {
    config.adapter = async (cfg: any) => {
      await delay(600);
      const url = cfg.url || '';
      const method = (cfg.method || 'get').toLowerCase();
      const data = getMockResponse(url, method, cfg);
      return { data, status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config: cfg, request: {} };
    };
    return config;
  });
}

export const instance = axios.create({
  baseURL: 'https://melodix.gerrygurusinga.xyz',
  timeout: 35000,
});

export const heavyInstance = axios.create({
  baseURL: 'https://melodix.gerrygurusinga.xyz',
  timeout: 120000,
});

setupMockAdapter(instance);
setupMockAdapter(heavyInstance);
