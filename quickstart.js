#!/usr/bin/env node

/**
 * mp3url Quick Start Demo
 *
 * Run this to see mp3url in action:
 *   node quickstart.js
 *
 * This creates a playlist, adds tracks, and shows the M3U output.
 */

import { createPlaylist, addTrack, serialize, parse } from './index.js';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    mp3url Quick Start                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Step 1: Create a new playlist
console.log('1️⃣  Creating a new playlist...\n');
const playlist = createPlaylist();

// Step 2: Add some tracks
console.log('2️⃣  Adding tracks...\n');
addTrack(playlist, 'https://example.com/lofi-beats.mp3', 'Lo-Fi Beats to Study', 180);
addTrack(playlist, 'https://example.com/jazz-vibes.mp3', 'Smooth Jazz Vibes', 240);
addTrack(playlist, 'https://example.com/ambient.mp3', 'Ambient Relaxation', 300, [
  { type: 'EXTVLCOPT', key: 'start-time', value: '30' }  // Start 30 seconds in
]);

console.log(`   Added ${playlist.tracks.length} tracks to playlist\n`);

// Step 3: Convert to M3U format
console.log('3️⃣  Converting to M3U format:\n');
const m3uContent = serialize(playlist);
console.log('┌─────────────────────────────────────────────────────────────┐');
m3uContent.split('\n').forEach(line => {
  console.log(`│ ${line.padEnd(59)} │`);
});
console.log('└─────────────────────────────────────────────────────────────┘\n');

// Step 4: Parse it back to JSON
console.log('4️⃣  Parsing M3U back to JSON:\n');
const parsed = parse(m3uContent);
console.log('   Playlist structure:');
console.log(`   • Headers: ${parsed.headers.length}`);
console.log(`   • Tracks:  ${parsed.tracks.length}\n`);

parsed.tracks.forEach((track, i) => {
  console.log(`   Track ${i + 1}: "${track.title}"`);
  console.log(`            Duration: ${track.duration}s`);
  if (track.directives.length > 0) {
    track.directives.forEach(d => {
      if (d.type === 'EXTVLCOPT') {
        console.log(`            ${d.key}: ${d.value}`);
      }
    });
  }
  console.log();
});

// Show that it round-trips correctly
console.log('5️⃣  Round-trip verification:');
const roundTrip = serialize(parse(m3uContent));
const matches = roundTrip === m3uContent;
console.log(`   parse(serialize(playlist)) === original? ${matches ? '✓ Yes!' : '✗ No'}\n`);

console.log('══════════════════════════════════════════════════════════════');
console.log('                     🎉 That\'s mp3url!');
console.log('');
console.log('  • Parse M3U files to JSON for easy manipulation');
console.log('  • Serialize back to M3U for players like VLC');
console.log('  • Use the CLI: mp3url parse playlist.m3u output.json');
console.log('══════════════════════════════════════════════════════════════\n');
