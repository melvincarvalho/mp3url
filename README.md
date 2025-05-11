# mp3url

A JavaScript library for parsing and serializing M3U playlist files.

## Features

- Parse M3U files into JSON objects
- Serialize JSON objects back to M3U format
- Support for common M3U directives like `#EXTINF` and `#EXTVLCOPT`
- Lenient parsing for simplified playlist formats
- Create and manipulate playlists programmatically
- Command-line interface for quick file operations

## Installation

```bash
# Install locally in your project
npm install mp3url

# Or install globally to use the CLI
npm install -g mp3url
```

## Usage

### Importing the Library

```javascript
// ES Module import
import { parse, serialize, createPlaylist, addTrack } from 'mp3url'
```

### Parsing M3U Files

```javascript
import { parse } from 'mp3url'
import { readFile } from 'fs/promises'

// Read M3U file
const content = await readFile('playlist.m3u', 'utf8')

// Parse to JSON object
const playlist = parse(content)
console.log(playlist)
```

### Serializing to M3U Format

```javascript
import { serialize } from 'mp3url'
import { writeFile } from 'fs/promises'

// Create or modify playlist object
const playlist = {
  headers: [{ type: 'EXTM3U' }],
  tracks: [
    {
      url: 'https://example.com/song.mp3',
      title: 'My Favorite Song',
      duration: 180,
      directives: [{ type: 'EXTVLCOPT', key: 'start-time', value: '15' }]
    }
  ]
}

// Serialize to M3U format
const m3uContent = serialize(playlist)
await writeFile('output.m3u', m3uContent)
```

### Creating a New Playlist

```javascript
import { createPlaylist, addTrack, serialize } from 'mp3url'
import { writeFile } from 'fs/promises'

// Create empty playlist
const playlist = createPlaylist()

// Add tracks
addTrack(playlist, 'https://example.com/song1.mp3', 'First Song', 180, [
  { type: 'EXTVLCOPT', key: 'start-time', value: '15' }
])
addTrack(playlist, 'https://example.com/song2.mp3', 'Second Song', 240)

// Save the playlist
const m3uContent = serialize(playlist)
await writeFile('new-playlist.m3u', m3uContent)
```

## JSON Format

The library represents M3U playlists as JSON objects with the following structure:

```javascript
{
  // Playlist headers and general directives
  "headers": [
    { "type": "EXTM3U" },
    { "raw": "#EXTGENRE:Rock" }
  ],

  // Array of tracks in the playlist
  "tracks": [
    {
      "url": "https://example.com/song.mp3",
      "title": "Song Title",
      "duration": 180, // in seconds, -1 if unknown
      "directives": [
        { "type": "EXTVLCOPT", "key": "start-time", "value": "15" },
        { "raw": "#CUSTOM:Some custom directive" }
      ]
    }
  ]
}
```

## Command Line Interface

The package includes a CLI tool for quick operations:

```bash
# Display help
mp3url help

# Parse M3U file to JSON
mp3url parse playlist.m3u output.json

# Convert JSON to M3U format
mp3url serialize playlist.json output.m3u

# Create an empty playlist
mp3url create new-playlist.m3u

# Add a track to a playlist
mp3url add playlist.m3u https://example.com/song.mp3 "Song Title" 180
```

## Supported Directives

The library understands and can parse/serialize the following directives:

- `#EXTM3U`: M3U header
- `#EXTINF:duration,title`: Track information
- `#EXTVLCOPT:key=value`: VLC specific options
- Any other directive is preserved as raw text

### Lenient Parsing

The parser is designed to handle simplified M3U formats. For example, the following minimal playlist will parse correctly:

```
#EXTVLCOPT:start-time=15
https://example.com/song.mp3
```

This will be parsed as a track with the start-time directive, even without the typical `#EXTINF` line.

## Examples

### Input M3U Example

```
#EXTM3U
#EXTINF:180,My Favorite Song
#EXTVLCOPT:start-time=15
https://example.com/song.mp3
#EXTINF:240,Another Great Song
https://example.com/song2.mp3
```

### Parsed JSON Result

```json
{
  "headers": [{ "type": "EXTM3U" }],
  "tracks": [
    {
      "url": "https://example.com/song.mp3",
      "title": "My Favorite Song",
      "duration": 180,
      "directives": [
        { "type": "EXTVLCOPT", "key": "start-time", "value": "15" }
      ]
    },
    {
      "url": "https://example.com/song2.mp3",
      "title": "Another Great Song",
      "duration": 240,
      "directives": []
    }
  ]
}
```

## License

MIT
