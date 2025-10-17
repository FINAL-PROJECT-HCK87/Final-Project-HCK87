const { ObjectId } = require("mongodb");
const { getDB } = require("../config/mongodb");
const { default: axios } = require("axios");
const Controller = require("./Controller");
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

class PlaylistController {
  static getCollection() {
    // console.log("<<<<<<<< GETDB")
    const db = getDB();
    const collection = db.collection("playlists");
    return collection;
  }
  static async getSpotifyToken(req, res, next) {
    try {
      const resp = await axios.post(
        `https://accounts.spotify.com/api/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
        }),
        {
          headers: {
            Authorization:
              "Basic " +
              new Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString(
                "base64"
              ),
          },
        }
      );
      // console.log(resp)
      return resp.data.access_token;
      // return res.status(200).json({access_token: resp.data.access_token})
    } catch (error) {
      next(error);
    }
  }

  static async getSpotifySong(req, res, next) {
    try {
      const checkCollection = Controller.getCollection();
      const collection = PlaylistController.getCollection();
      const token = await PlaylistController.getSpotifyToken();
      // console.log(token, "<<<< INI TOKEN")
      const { isrc } = req.body;
      const data = await checkCollection.findOne({ isrc });
      // console.log(data)
      if (!data) throw new Error("Data Not found");
      const resp = await axios.get(
        `https://api.spotify.com/v1/search?q=isrc%3A${isrc}&type=track%2Cplaylist`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const songs = await resp.data;
      // console.log(songs)
      //simpan ke db
      const { playlists } = songs;
      const { items } = playlists;
      if (items.length === 0) throw { name: "No playlist found" };
      const result = items.map((el) => {
        return {
          base_song_isrc: id,
          spotify_playlist_id: el.id || null,
          cover_image_url: el.images?.[0]?.url || null,
          owner_name: el.owner?.display_name || "Unknown",
          total_tracks: el.tracks?.total || 0,
          playlist_name: el.name || "Untitled Playlist",
          spotify_url: el.external_urls?.spotify || null,
          description: el.description || null,
        };
      });
      const fetchTracks = async (playlist_id) => {
        try {
          const resp = await axios.get(
            `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const tracks = await resp.data;
          const result = tracks.items
            .filter((el) => el && el.track) // Filter out null/undefined items
            .map((el) => {
              const track = el.track;
              return {
                isrc: track.external_ids?.isrc || null,
                spotify_url: track.external_urls?.spotify || null,
                spotify_song_id: track.id || null,
                song_name: track.name || "Unknown",
                song_popularity: track.popularity || 0,
                song_duration: track.duration_ms || 0,
                artists:
                  track.artists?.map((artist) => ({
                    name: artist.name || "Unknown",
                    spotify_id: artist.id || null,
                    spotify_url: artist.external_urls?.spotify || null,
                  })) || [],
                album: {
                  name: track.album?.name || "Unknown",
                  spotify_id: track.album?.id || null,
                  release_date: track.album?.release_date || null,
                  total_tracks: track.album?.total_tracks || 0,
                  images:
                    track.album?.images?.map((img) => ({
                      url: img.url,
                      height: img.height,
                      width: img.width,
                    })) || [],
                },
                video_url: el.video_thumbnail?.url || null,
                added_at: el.added_at || null,
              };
            });
          return result;
        } catch (error) {
          console.error(
            `Error fetching tracks for playlist ${playlist_id}:`,
            error.message
          );
          return []; // Return empty array on error to prevent breaking the flow
        }
      };
      // Use Promise.all to wait for all fetchTracks calls to complete
      const finalData = await Promise.all(
        result.map(async (el) => {
          el.tracks = await fetchTracks(el.spotify_playlist_id);
          return el;
        })
      );

      const savedData = await collection.insertMany(finalData);
      res.status(201).json(savedData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PlaylistController;
