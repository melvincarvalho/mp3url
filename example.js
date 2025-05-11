#!/usr/bin/env node

/**
 * Example usage of mp3url library
 */

import { parse, serialize, createPlaylist, addTrack } from './index.js';
import { readFile, writeFile } from 'fs/promises';

// Example M3U content
const exampleM3U = `#EXTM3U
#EXTINF:180,My Favorite Song
#EXTVLCOPT:start-time=15
https://example.com/song.mp3
#EXTINF:240,Another Great Song
https://example.com/song2.mp3
`;

async function runExample () {
  try {
    console.log('=== MP3URL Library Example ===\n');

    // Parse example M3U content
    console.log('Parsing M3U content:');
    const playlist = parse(exampleM3U);
    console.log(JSON.stringify(playlist, null, 2));
    console.log('\n');

    // Save the parsed JSON to a file
    await writeFile('example.json', JSON.stringify(playlist, null, 2));
    console.log('Saved parsed JSON to example.json\n');

    // Create a new playlist and add a track
    console.log('Creating a new playlist:');
    const newPlaylist = createPlaylist();

    // Add a track with EXTVLCOPT directive
    addTrack(
      newPlaylist,
      'https://example.com/new-song.mp3',
      'Brand New Song',
      195,
      [{ type: 'EXTVLCOPT', key: 'start-time', value: '30' }]
    );

    // Add another track
    addTrack(
      newPlaylist,
      'https://example.com/another-song.mp3',
      'Another Amazing Song',
      210
    );

    // Serialize the playlist back to M3U format
    const serialized = serialize(newPlaylist);
    console.log(serialized);
    console.log('\n');

    // Save the serialized content to a file
    await writeFile('example-output.m3u', serialized);
    console.log('Saved new playlist to example-output.m3u');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

runExample(); 