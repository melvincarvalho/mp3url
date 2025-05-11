#!/usr/bin/env node

/**
 * Simple tests for mp3url library
 */

import { parse, serialize, createPlaylist, addTrack } from './index.js';
import { strict as assert } from 'assert';

console.log('Running tests for mp3url library...');

// Test 1: Parse and serialize should be reciprocal
function testParseAndSerialize () {
  console.log('Test 1: Parse and serialize consistency');

  const original = `#EXTM3U
#EXTINF:180,Test Song
#EXTVLCOPT:start-time=15
https://example.com/song.mp3`;

  const parsed = parse(original);
  const serialized = serialize(parsed);

  // Normalize line endings for comparison
  const normalizedOriginal = original.replace(/\r\n/g, '\n');
  const normalizedSerialized = serialized.replace(/\r\n/g, '\n');

  assert.equal(normalizedSerialized, normalizedOriginal, 'Serialized content should match original');
  console.log('✓ Parse and serialize work reciprocally');
}

// Test 2: Create playlist and add tracks
function testCreatePlaylist () {
  console.log('Test 2: Creating playlists');

  const playlist = createPlaylist();
  assert.equal(playlist.headers.length, 1, 'Playlist should have a default header');
  assert.equal(playlist.tracks.length, 0, 'Playlist should start with no tracks');

  addTrack(playlist, 'https://example.com/song.mp3', 'Test Song', 180);
  assert.equal(playlist.tracks.length, 1, 'Playlist should have 1 track after adding');
  assert.equal(playlist.tracks[0].url, 'https://example.com/song.mp3', 'Track URL should match');
  assert.equal(playlist.tracks[0].title, 'Test Song', 'Track title should match');
  assert.equal(playlist.tracks[0].duration, 180, 'Track duration should match');

  console.log('✓ Creating playlists and adding tracks works');
}

// Test 3: Parse EXTVLCOPT directives
function testVLCDirectives () {
  console.log('Test 3: Parsing VLC directives');

  const content = `#EXTM3U
#EXTINF:180,VLC Test
#EXTVLCOPT:start-time=15
#EXTVLCOPT:stop-time=175
https://example.com/song.mp3`;

  const playlist = parse(content);
  const track = playlist.tracks[0];

  assert.equal(track.directives.length, 2, 'Track should have 2 directives');
  assert.equal(track.directives[0].type, 'EXTVLCOPT', 'Directive should be of type EXTVLCOPT');
  assert.equal(track.directives[0].key, 'start-time', 'First directive key should be start-time');
  assert.equal(track.directives[0].value, '15', 'First directive value should be 15');
  assert.equal(track.directives[1].key, 'stop-time', 'Second directive key should be stop-time');
  assert.equal(track.directives[1].value, '175', 'Second directive value should be 175');

  console.log('✓ VLC directives are parsed correctly');
}

// Test 4: Lenient parsing of simplified playlists
function testLenientParsing () {
  console.log('Test 4: Lenient parsing of simplified playlists');

  const content = `#EXTVLCOPT:start-time=15
https://example.com/song.mp3`;

  const playlist = parse(content);

  assert.equal(playlist.tracks.length, 1, 'Playlist should have 1 track');
  const track = playlist.tracks[0];

  assert.equal(track.url, 'https://example.com/song.mp3', 'Track URL should match');
  assert.equal(track.directives.length, 1, 'Track should have 1 directive');
  assert.equal(track.directives[0].type, 'EXTVLCOPT', 'Directive should be of type EXTVLCOPT');
  assert.equal(track.directives[0].key, 'start-time', 'Directive key should be start-time');
  assert.equal(track.directives[0].value, '15', 'Directive value should be 15');

  console.log('✓ Simplified playlists are parsed correctly');
}

// Run all tests
try {
  testParseAndSerialize();
  testCreatePlaylist();
  testVLCDirectives();
  testLenientParsing();
  console.log('\nAll tests passed! ✓');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
} 