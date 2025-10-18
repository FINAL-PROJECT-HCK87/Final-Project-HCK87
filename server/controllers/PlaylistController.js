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

  static getArtistCollection() {
    const db = getDB();
    const collection = db.collection("artists");
    return collection;
  }

  static getSongCollection() {
    const db = getDB();
    const collection = db.collection("songs");
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

      const { isrc, title, artist_subtitle } = req.body;

      if (!isrc && !title) {
        throw {
          name: "ValidationError",
          message: "Either ISRC or title is required",
        };
      }

      // Step 1: Find the track first using ISRC or title + artist
      let trackId = null;
      let trackName = title || "";

      if (isrc) {
        // Search by ISRC
        const trackResp = await axios.get(
          `https://api.spotify.com/v1/search?q=isrc%3A${isrc}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (
          trackResp.data &&
          trackResp.data.tracks &&
          Array.isArray(trackResp.data.tracks.items) &&
          trackResp.data.tracks.items.length > 0
        ) {
          trackId = trackResp.data.tracks.items[0].id;
          trackName = trackResp.data.tracks.items[0].name;
        }
      }

      // If ISRC search didn't work, try searching by title and artist
      if (!trackId && title) {
        const searchQuery = artist_subtitle
          ? `track:${title} artist:${artist_subtitle}`
          : `track:${title}`;

        const trackResp = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            searchQuery
          )}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (
          trackResp.data &&
          trackResp.data.tracks &&
          Array.isArray(trackResp.data.tracks.items) &&
          trackResp.data.tracks.items.length > 0
        ) {
          trackId = trackResp.data.tracks.items[0].id;
          trackName = trackResp.data.tracks.items[0].name;
        }
      }

      if (!trackId) {
        throw { name: "NotFound", message: "Track not found on Spotify" };
      }

      // Step 2: Search for playlists containing this track
      const playlistResp = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          trackName
        )}&type=playlist&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Validate playlist response
      if (
        !playlistResp.data ||
        !playlistResp.data.playlists ||
        !playlistResp.data.playlists.items
      ) {
        throw {
          name: "NotFound",
          message: "Invalid response from Spotify API",
        };
      }

      const { items } = playlistResp.data.playlists;
      if (!Array.isArray(items) || items.length === 0) {
        throw { name: "NotFound", message: "No playlist found" };
      }
      // Step 3: Filter playlists that actually contain the track
      const verifyAndMapPlaylists = async (playlistItems) => {
        const verifiedPlaylists = [];

        for (const playlist of playlistItems) {
          try {
            // Skip if playlist doesn't have an id
            if (!playlist || !playlist.id) {
              console.warn("Skipping playlist without id:", playlist);
              continue;
            }

            // Check if this playlist contains our track
            const tracksResp = await axios.get(
              `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?fields=items(track(id))&limit=100`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            // Safely check if the array exists and has items
            if (!tracksResp.data || !Array.isArray(tracksResp.data.items)) {
              console.warn(`No tracks data for playlist ${playlist.id}`);
              continue;
            }

            // Filter out null/undefined items and tracks before checking
            const containsTrack = tracksResp.data.items.some(
              (item) => item && item.track && item.track.id === trackId
            );

            if (containsTrack) {
              verifiedPlaylists.push({
                base_song_isrc: isrc || null,
                base_song_title: title || trackName,
                base_song_artist: artist_subtitle || null,
                spotify_track_id: trackId,
                spotify_playlist_id: playlist.id || null,
                cover_image_url: playlist.images?.[0]?.url || null,
                owner_name: playlist.owner?.display_name || "Unknown",
                total_tracks: playlist.tracks?.total || 0,
                playlist_name: playlist.name || "Untitled Playlist",
                spotify_url: playlist.external_urls?.spotify || null,
                description: playlist.description || null,
              });
            }
          } catch (error) {
            console.error(
              `Error verifying playlist ${playlist?.id || "unknown"}:`,
              error.message
            );
            // Continue to next playlist instead of breaking
            continue;
          }
        }

        return verifiedPlaylists;
      };

      const result = await verifyAndMapPlaylists(items);

      if (result.length === 0) {
        throw {
          name: "NotFound",
          message: "No playlists found containing this track",
        };
      }

      // Step 4: Validate if playlists already exist in database
      const existingPlaylists = await collection
        .find({
          spotify_playlist_id: {
            $in: result.map((p) => p.spotify_playlist_id),
          },
        })
        .toArray();

      const existingPlaylistIds = new Set(
        existingPlaylists.map((p) => p.spotify_playlist_id)
      );

      // Filter out playlists that already exist
      const newPlaylists = result.filter(
        (p) => !existingPlaylistIds.has(p.spotify_playlist_id)
      );

      if (newPlaylists.length === 0) {
        return res.status(200).json({
          message: "All playlists already exist in database",
          existing_playlists_count: existingPlaylists.length,
          playlists: existingPlaylists.map((p) => ({
            playlist_name: p.playlist_name,
            spotify_playlist_id: p.spotify_playlist_id,
            spotify_url: p.spotify_url,
          })),
        });
      }

      // Log which playlists already exist
      if (existingPlaylistIds.size > 0) {
        console.log(
          `Skipping ${existingPlaylistIds.size} playlists that already exist`
        );
      }

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
                    slug: artist.name
                      ? artist.name.toLowerCase().replace(/\s+/g, "-")
                      : "unknown",
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
      // Use Promise.all to wait for all fetchTracks calls to complete (only for new playlists)
      const finalData = await Promise.all(
        newPlaylists.map(async (el) => {
          el.tracks = await fetchTracks(el.spotify_playlist_id);
          return el;
        })
      );

      // Extract all unique artists from all tracks across all playlists
      const artistsSet = new Map(); // Use Map to avoid duplicates by spotify_id
      const songsMap = new Map(); // Use Map to avoid duplicate songs by spotify_song_id

      finalData.forEach((playlist) => {
        playlist.tracks.forEach((track) => {
          // Collect artists
          track.artists.forEach((artist) => {
            if (artist.spotify_id && !artistsSet.has(artist.spotify_id)) {
              artistsSet.set(artist.spotify_id, {
                name: artist.name,
                slug: artist.slug,
                spotify_id: artist.spotify_id,
                spotify_url: artist.spotify_url,
              });
            }
          });

          // Collect songs
          if (track.spotify_song_id && !songsMap.has(track.spotify_song_id)) {
            songsMap.set(track.spotify_song_id, {
              isrc: track.isrc || "",
              title: track.song_name || "",
              artist_ids:
                track.artists.map((a) => a.spotify_id).filter((id) => id) || [],
              artist_subtitle:
                track.artists.map((a) => a.name).join(", ") || "",
              album: track.album?.name || "",
              release_date: track.album?.release_date || "",
              cover_art_url: track.album?.images?.[0]?.url || "",
              duration_ms: track.song_duration || 0,
              spotify_url: track.spotify_url || "",
              spotify_uri: track.spotify_song_id
                ? `spotify:track:${track.spotify_song_id}`
                : "",
              spotify_song_id: track.spotify_song_id || "",
              apple_music_url: "",
              preview_url: "",
              youtube_url:
                track.song_name && track.artists?.[0]?.name
                  ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      track.artists[0].name + " " + track.song_name
                    )}`
                  : "",
              genre: "",
              popularity: track.song_popularity || 0,
              created_at: new Date(),
            });
          }
        });
      });

      // Convert Map to array
      const uniqueArtists = Array.from(artistsSet.values());
      const uniqueSongs = Array.from(songsMap.values());

      // Save artists to artists collection (using bulkWrite to handle duplicates)
      const artistCollection = PlaylistController.getArtistCollection();

      if (uniqueArtists.length > 0) {
        const bulkOps = uniqueArtists.map((artist) => ({
          updateOne: {
            filter: { spotify_id: artist.spotify_id },
            update: { $set: artist },
            upsert: true,
          },
        }));

        await artistCollection.bulkWrite(bulkOps);
        console.log(`Saved/updated ${uniqueArtists.length} artists`);
      }

      // Save songs to songs collection (check if exists first)
      const songCollection = PlaylistController.getSongCollection();
      let savedSongsCount = 0;

      if (uniqueSongs.length > 0) {
        const songBulkOps = [];

        for (const song of uniqueSongs) {
          // Check if song exists by spotify_song_id or isrc
          const existingSong = await songCollection.findOne({
            $or: [
              { spotify_song_id: song.spotify_song_id },
              ...(song.isrc ? [{ isrc: song.isrc }] : []),
            ],
          });

          if (!existingSong) {
            // Song doesn't exist, add to bulk insert
            songBulkOps.push({
              insertOne: {
                document: song,
              },
            });
          }
        }

        if (songBulkOps.length > 0) {
          const songResult = await songCollection.bulkWrite(songBulkOps);
          savedSongsCount = songResult.insertedCount || 0;
          console.log(
            `Saved ${savedSongsCount} new songs (${
              uniqueSongs.length - savedSongsCount
            } already existed)`
          );
        } else {
          console.log(
            `All ${uniqueSongs.length} songs already exist in database`
          );
        }
      }

      // Step 5: Modify tracks data to only include isrc and song_name before saving playlists
      const playlistsToSave = finalData.map((playlist) => ({
        ...playlist,
        tracks: playlist.tracks.map((track) => ({
          isrc: track.isrc || "",
          song_name: track.song_name || "",
        })),
      }));

      // Save playlists to playlists collection
      const savedData = await collection.insertMany(playlistsToSave);

      res.status(201).json({
        message: "Playlists saved successfully",
        playlists_count: savedData.insertedCount,
        existing_playlists_skipped: existingPlaylistIds.size,
        artists_count: uniqueArtists.length,
        songs_count: savedSongsCount,
        total_unique_songs: uniqueSongs.length,
        data: savedData,
      });
    } catch (error) {
      next(error);
    }
  }

  //!CRUD Playlist
  static async createUserPlaylist(req, res, next) {
    try {
      const collection = PlaylistController.getCollection();
      const deviceId = req.headers["x-device-id"];
      console.log(req.body);
      const { playlistName } = req.body; //playlist data should be userId, song_name and userName
      const payload = {
        playlist_name: playlistName,
        createdAt: new Date(),
        tracks: [],
        deviceId,
      };
      const result = await collection.insertOne(payload);
      res.status(201).json({ message: "Playlist created", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUserPlaylists(req, res, next) {
    try {
      const collection = PlaylistController.getCollection();
      const deviceId = req.headers["x-device-id"];
      const playlists = await collection.find({ deviceId }).toArray();
      res.status(200).json({ data: playlists });
    } catch (error) {
      next(error);
    }
  }
  static async getUserPlaylistById(req, res, next) {
    try {
      const collection = PlaylistController.getCollection();
      const playlistId = req.params.playlistId;
      const playlist = await collection.findOne({
        _id: new ObjectId(playlistId),
      });
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.status(200).json({ data: playlist });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserPlaylist(req, res, next) {
    try {
      const collection = PlaylistController.getCollection();
      const playlistId = req.params.playlist_id;
      // console.log(req.params)
      const { songData } = req.body;
      //* Find existing song in the playlist, if it exists, do not add again
      const existingPlaylist = await collection.findOne({
        _id: new ObjectId(playlistId),
      });
      if (!existingPlaylist)
        return res.status(404).json({ message: "Playlist not found" });
      // if (existingPlaylist.tracks.length > 0){
      //   const foundTrack = existingPlaylist.tracks.find(el => el.isrc === songData.isrc)
      //   if(foundTrack) return res.status(400).json({ message: "Song already exists in the playlist" });
      //   //* Push songs to existing playlist
      //   await collection.updateOne(
      //     { _id: new ObjectId(playlistId) },
      //     { $push: { tracks:   songData  } }
      //   );
      // }
      const isDuplicate =
        existingPlaylist.tracks?.some((el) => el.isrc === songData.isrc) ||
        false;

      if (isDuplicate) {
        return res
          .status(400)
          .json({ message: "Song already exists in the playlist" });
      }
      await collection.updateOne(
        { _id: new ObjectId(playlistId) },
        { $push: { tracks: songData } }
      );

      return res.status(200).json({ message: "Song added successfully" });
    } catch (error) {
      // console.log(error)
      next(error);
    }
  }

  static async deleteUserPlaylist(req, res, next) {
    try {
      const collection = PlaylistController.getCollection();
      const playlistId = req.params.playlistId;
      const result = await collection.deleteOne({
        _id: new ObjectId(playlistId),
      });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.status(200).json({ message: "Playlist deleted" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PlaylistController;
