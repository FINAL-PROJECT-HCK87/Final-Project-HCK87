# Melodix API Documentation


## Table of Contents
- [Users](#users)
- [Songs](#songs)
- [Artists](#artists)
- [Playlists](#playlists)
- [Error Handling](#error-handling)

---

## Users

### 1. Create/Get User (Register/Login)
**POST** `/users`

Create a new user or get existing user by device ID.

**Request Body:**
```json
{
  "device_id": "string"
}
```

**Response (201 Created or 200 OK):**
```json
{
  "_id": "user_object_id",
  "device_id": "string",
  "is_anonymous": true,
  "search_history": [],
  "created_at": "2025-10-19T00:00:00.000Z",
  "updated_at": "2025-10-19T00:00:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "device_id is required"
}
```

---

### 2. Add Song to Search History
**POST** `/users/search-history`

Add a song to user's search history.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Request Body:**
```json
{
  "song_id": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Search history updated"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "song_id is required"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Song not found"
}
```

**Response (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

### 3. Get Search History
**GET** `/users/search-history`

Retrieve user's search history with populated song data.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Response (200 OK):**
```json
{
  "search_history": [
    {
      "_id": "song_object_id",
      "isrc": "string",
      "title": "string",
      "artist": "string",
      "artist_image_url": "string",
      "album": "string",
      "cover_art_url": "string",
      "duration_ms": 0,
      "spotify_url": "string",
      "apple_music_url": "string",
      "preview_url": "string",
      "youtube": "string",
      "genre": "string",
      "release_date": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

### 4. Delete Song from History
**DELETE** `/users/search-history/:song_id`

Remove a specific song from user's search history.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "song_id": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Song removed from history"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Song not found in history"
}
```

---

### 5. Clear All History
**DELETE** `/users/search-history`

Clear entire search history for the user.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "All history cleared"
}
```

---

### 6. Get Artists from History
**GET** `/users/artists-from-history`

Get unique artists from user's search history.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Response (200 OK):**
```json
{
  "artists": [
    {
      "_id": "artist_object_id",
      "name": "string",
      "slug": "string",
      "image_url": "string"
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

## Songs

### 1. Recognize Song (Shazam Integration)
**POST** `/songs/recognize`

Identify a song using audio file via Shazam API.

**Headers:**
```json
{
    "x-device-id": "string",
    "Content-type": "multipart/form-data"
}
```

**Request Body (multipart/form-data):**
```json
{
    "audio": "file"
}
```

**Response (200 OK):**
```json
{
  "_id": "song_object_id",
  "isrc": "string",
  "title": "string",
  "artist": "Artist Name",
  "artist_ids": ["artist_id_1", "artist_id_2"],
  "artist_image_url": "string",
  "album": "string",
  "cover_art_url": "string",
  "duration_ms": 0,
  "spotify_url": "string",
  "spotify_uri": "spotify:track:xxx",
  "apple_music_url": "string",
  "preview_url": "string",
  "youtube": "string",
  "genre": "string",
  "release_date": "2025-01-01T00:00:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "No audio file provided"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Song not found",
  "error": "Could not identify the song"
}
```

**Response (408 Request Timeout):**
```json
{
  "message": "Request timeout",
  "error": "Song recognition took too long"
}
```

---

### 2. Get Song by ID
**GET** `/songs/:id`

Retrieve song details by song ID.

**URL Parameters:**
```json
{
    "id": "string (ObjectId)"
}
```

**Response (200 OK):**
```json
{
  "_id": "song_object_id",
  "isrc": "string",
  "title": "string",
  "artist": "string",
  "artist_ids": ["artist_id"],
  "artist_image_url": "string",
  "album": "string",
  "cover_art_url": "string",
  "duration_ms": 0,
  "spotify_url": "string",
  "spotify_uri": "string",
  "apple_music_url": "string",
  "preview_url": "string",
  "youtube_url": "string",
  "genre": "string",
  "release_date": "2025-01-01T00:00:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid song ID format"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Song not found"
}
```

---

### 3. Create/Find Song
**POST** `/songs`

Create a new song or return existing song by ISRC.

**Request Body:**
```json
{
  "isrc": "string",
  "title": "string",
  "artist": "string",
  "album": "string",
  "cover_art_url": "string",
  "duration_ms": 0,
  "spotify_url": "string",
  "apple_music_url": "string",
  "preview_url": "string",
  "release_date": "2025-01-01T00:00:00.000Z",
  "genre": "string"
}
```

**Response (201 Created or 200 OK):**
```json
{
  "_id": "song_object_id",
  "isrc": "string",
  "title": "string",
  "artist": "string",
  "album": "string",
  "release_date": "2025-01-01T00:00:00.000Z",
  "cover_art_url": "string",
  "duration_ms": 0,
  "spotify_url": "string",
  "apple_music_url": "string",
  "preview_url": "string",
  "genre": "string"
}
```

---

### 4. Get Top Popular Songs
**GET** `/songs/top/popular`

Get the top 4 most searched songs across all users.

**Response (200 OK):**
```json
{
  "top_songs": [
    {
      "_id": "song_object_id",
      "title": "string",
      "artist": "string",
      "artist_image_url": "string",
      "cover_art_url": "string",
      "search_count": 0
    }
  ]
}
```

---

## Artists

### 1. Get Artist Concerts
**GET** `/artists/:id/concerts`

Get upcoming concerts for an artist via Ticketmaster API.

**URL Parameters:**
```json
{
    "id": "string (ObjectId)"
}
```

**Query Parameters:**
```json
{
    "date": "string (optional, default: `upcoming`)",
    "country": "string (optional, country name or code)",
    "limit": "number (optional, default: 50)"
}
```

**Response (200 OK):**
```json
{
  "artist": {
    "_id": "artist_object_id",
    "name": "string",
    "image_url": "string"
  },
  "concerts": [
    {
      "id": "event_id",
      "title": "string",
      "datetime": "2025-10-20T19:00:00Z",
      "venue": {
        "name": "string",
        "city": "string",
        "region": "string",
        "country": "string",
        "latitude": "string",
        "longitude": "string"
      },
      "lineup": ["Artist Name"],
      "description": "string",
      "url": "string",
      "offers": [
        {
          "type": "string",
          "currency": "USD",
          "min": 50,
          "max": 150
        }
      ]
    }
  ],
  "total": 0
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid artist ID format"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Artist not found"
}
```

---

## Playlists

### 1. Get Spotify Playlists (Create from Song)
**POST** `/playlists`

Search Spotify playlists containing a specific song and save to database.

**Request Body:**
```json
{
  "isrc": "string",
  "title": "string",
  "artist_subtitle": "string"
}
```

**Response (201 Created):**
```json
{
  "message": "Playlists saved successfully",
  "playlists_count": 0,
  "existing_playlists_skipped": 0,
  "artists_count": 0,
  "songs_count": 0,
  "total_unique_songs": 0,
  "data": {}
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Validation error",
  "error": "Either ISRC or title is required"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Track not found on Spotify"
}
```

---

### 2. Create User Playlist
**POST** `/playlists/create`

Create a new empty playlist for the user.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Request Body:**
```json
{
  "playlistName": "string"
}
```

**Response (201 Created):**
```json
{
  "message": "Playlist created",
  "data": {}
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Playlist name is required"
}
```

---

### 3. Get All User Playlists
**GET** `/playlists/all`

Retrieve all playlists for the current user/device.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "playlist_object_id",
      "playlist_name": "string",
      "createdAt": "2025-10-19T00:00:00.000Z",
      "tracks": [
        {
          "_id": "song_object_id",
          "isrc": "string",
          "song_name": "string",
          "artist": "string",
          "cover_art_url": "string",
          "duration_ms": 0,
          "spotify_url": "string"
        }
      ],
      "deviceIds": ["device_id"],
      "ownerId": "device_id"
    }
  ]
}
```

---

### 4. Get Playlist by ID
**GET** `/playlists/:playlist_id`

Retrieve a specific playlist by ID.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "playlist_id": "string (ObjectId)"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "_id": "playlist_object_id",
    "playlist_name": "string",
    "createdAt": "2025-10-19T00:00:00.000Z",
    "tracks": [
      {
        "_id": "song_object_id",
        "isrc": "string",
        "song_name": "string",
        "artist": "string",
        "cover_art_url": "string",
        "duration_ms": 0,
        "spotify_url": "string"
      }
    ],
    "deviceIds": ["device_id"],
    "ownerId": "device_id"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid playlist ID format"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Playlist not found"
}
```

---

### 5. Update Playlist (Add Song)
**PUT** `/playlists/:playlist_id`

Add a song to a playlist.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "playlist_id": "string (ObjectId)"
}
```

**Request Body:**
```json
{
  "songData": {
    "_id": "song_object_id"
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Song added successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Song ID is required"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Song already exists in the playlist"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Playlist not found"
}
```

---

### 6. Delete Playlist
**DELETE** `/playlists/:playlist_id`

Delete a playlist.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "playlist_id": "string (ObjectId)"
}
```

**Response (200 OK):**
```json
{
  "message": "Playlist deleted"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Playlist not found"
}
```

---

### 7. Share Playlist (Add Device)
**POST** `/playlists/:playlist_id/share`

Share a playlist with another device.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "playlist_id": "string (ObjectId)"
}
```
**Request Body:**
```json
{
  "newDeviceId": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Device added to playlist successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Device ID is required"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid playlist ID format"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Device already has access to this playlist"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Playlist not found"
}
```

---

### 8. Leave Shared Playlist
**DELETE** `/playlists/:playlist_id/leave`

Remove current device from a shared playlist.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "playlist_id": "string (ObjectId)"
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully left the playlist"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Owner cannot leave playlist. Delete the playlist instead."
}
```

**Response (400 Bad Request):**
```json
{
  "message": "You are not a member of this playlist."
}
```

**Response (404 Not Found):**
```json
{
  "message": "Playlist not found"
}
```

---

### 9. Remove Song from Playlist
**DELETE** `/playlists/:playlist_id/songs/:song_id`

Remove a song from a playlist (owner only).

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**URL Parameters:**
```json
{
    "playlist_id": "string (ObjectId)",
    "song_id": "string (ObjectId)"
}
```

**Response (200 OK):**
```json
{
  "message": "Song removed from playlist successfully"
}
```

**Response (403 Forbidden):**
```json
{
  "message": "Only the owner can delete songs from the playlist"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Playlist not found"
}
```

---

### 10. Get Playlists For You
**GET** `/playlists/for-you`

Get personalized playlists based on user's search history + featured playlists.

**Headers:**
```json
{
    "x-device-id": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Playlists fetched successfully",
  "data": [
    {
      "_id": "playlist_object_id",
      "playlist_name": "string",
      "song_count": 0,
      "cover_images": ["url1", "url2", "url3", "url4"],
      "tracks": [
        {
          "_id": "song_object_id",
          "title": "string",
          "cover_art_url": "string"
        }
      ]
    }
  ]
}
```

---

## Error Handling

The API uses consistent error responses across all endpoints.

### Global Error Responses

**Response (401 - Unauthorized):**
```json
{
  "message": "Invalid token"
}
```

**Response (403 - Forbidden):**
```json
{
  "message": "You are not authorized"
}
```

**Response (500 - Internal Server Error):**
```json
{
  "message": "Internal Server Errors"
}
```

### Error Handler Middleware Responses

**DocumentNotFoundError (404 - Not Found):**
```json
{
  "message": "Document not found",
  "error": "The requested document does not exist"
}
```

**No playlist found (404 - Not Found):**
```json
{
  "message": "No playlist found",
  "error": "The requested document does not exist"
}
```

**MongoNetworkError (503 - Service Unavailable):**
```json
{
  "message": "Database connection error",
  "error": "Unable to connect to MongoDB server"
}
```