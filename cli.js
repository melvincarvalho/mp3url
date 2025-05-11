#!/usr/bin/env node

/**
 * CLI interface for mp3url library
 */

import { readFile, writeFile } from 'fs/promises';
import { parse, serialize, createPlaylist, addTrack } from './index.js';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];

const usage = `
mp3url - M3U playlist file utility

Usage:
  mp3url parse <input.m3u> [output.json]    Parse M3U to JSON
  mp3url serialize <input.json> [output.m3u] Serialize JSON to M3U
  mp3url create <output.m3u>                Create empty M3U file
  mp3url add <playlist.m3u> <url> [title] [duration]  Add track to playlist
  mp3url swap <playlist.m3u> <index1> <index2>        Swap tracks in playlist
  mp3url help                               Show this help

Examples:
  mp3url parse playlist.m3u playlist.json
  mp3url serialize playlist.json playlist.m3u
  mp3url add playlist.m3u https://example.com/song.mp3 "My Song" 180
  mp3url swap playlist.m3u 0 3
`;

async function main () {
  try {
    if (!command || command === 'help') {
      console.log(usage);
      return;
    }

    switch (command) {
      case 'parse': {
        const inputFile = args[1];
        const outputFile = args[2];

        if (!inputFile) {
          console.error('Error: Input file required');
          console.log(usage);
          process.exit(1);
        }

        const content = await readFile(inputFile, 'utf8');
        const playlist = parse(content);

        if (outputFile) {
          await writeFile(outputFile, JSON.stringify(playlist, null, 2));
          console.log(`Parsed ${inputFile} to ${outputFile}`);
        } else {
          console.log(JSON.stringify(playlist, null, 2));
        }
        break;
      }

      case 'serialize': {
        const inputFile = args[1];
        const outputFile = args[2];

        if (!inputFile) {
          console.error('Error: Input file required');
          console.log(usage);
          process.exit(1);
        }

        const content = await readFile(inputFile, 'utf8');
        const playlist = JSON.parse(content);
        const m3uContent = serialize(playlist);

        if (outputFile) {
          await writeFile(outputFile, m3uContent);
          console.log(`Serialized ${inputFile} to ${outputFile}`);
        } else {
          console.log(m3uContent);
        }
        break;
      }

      case 'create': {
        const outputFile = args[1];

        if (!outputFile) {
          console.error('Error: Output file required');
          console.log(usage);
          process.exit(1);
        }

        const playlist = createPlaylist();
        const m3uContent = serialize(playlist);

        await writeFile(outputFile, m3uContent);
        console.log(`Created empty playlist at ${outputFile}`);
        break;
      }

      case 'add': {
        const playlistFile = args[1];
        const url = args[2];
        const title = args[3] || '';
        const duration = args[4] ? parseFloat(args[4]) : -1;

        if (!playlistFile || !url) {
          console.error('Error: Playlist file and URL required');
          console.log(usage);
          process.exit(1);
        }

        // Read existing playlist or create new one
        let playlist;
        try {
          const content = await readFile(playlistFile, 'utf8');
          playlist = parse(content);
        } catch (err) {
          // If file doesn't exist, create new playlist
          if (err.code === 'ENOENT') {
            playlist = createPlaylist();
          } else {
            throw err;
          }
        }

        // Add the track
        addTrack(playlist, url, title, duration);

        // Save the playlist
        const m3uContent = serialize(playlist);
        await writeFile(playlistFile, m3uContent);

        console.log(`Added track to ${playlistFile}`);
        break;
      }

      case 'swap': {
        const playlistFile = args[1];
        const index1 = parseInt(args[2]);
        const index2 = parseInt(args[3]);

        if (!playlistFile || isNaN(index1) || isNaN(index2)) {
          console.error('Error: Playlist file and two valid indices required');
          console.log(usage);
          process.exit(1);
        }

        // Read the playlist
        let playlist;
        try {
          const content = await readFile(playlistFile, 'utf8');
          playlist = parse(content);
        } catch (err) {
          console.error(`Error reading playlist file: ${err.message}`);
          process.exit(1);
        }

        // Validate the indices
        if (index1 < 0 || index2 < 0 ||
          index1 >= playlist.tracks.length ||
          index2 >= playlist.tracks.length) {
          console.error(`Error: Indices must be between 0 and ${playlist.tracks.length - 1}`);
          process.exit(1);
        }

        // Swap the tracks
        const temp = playlist.tracks[index1];
        playlist.tracks[index1] = playlist.tracks[index2];
        playlist.tracks[index2] = temp;

        // Save the playlist
        const m3uContent = serialize(playlist);
        await writeFile(playlistFile, m3uContent);

        console.log(`Swapped tracks at positions ${index1} and ${index2} in ${playlistFile}`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log(usage);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 