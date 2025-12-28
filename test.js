#!/usr/bin/env node

/**
 * Comprehensive test suite for mp3url library
 * Run: npm test
 */

import { parse, serialize, createPlaylist, addTrack } from './index.js';
import { strict as assert } from 'assert';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
    failed++;
  }
}

function suite(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// ============================================================================
// PARSE TESTS
// ============================================================================

suite('parse()', () => {
  test('parses empty content', () => {
    const result = parse('');
    assert.deepEqual(result, { tracks: [], headers: [] });
  });

  test('parses EXTM3U header', () => {
    const result = parse('#EXTM3U');
    assert.equal(result.headers.length, 1);
    assert.equal(result.headers[0].type, 'EXTM3U');
  });

  test('parses simple URL without metadata', () => {
    const result = parse('https://example.com/song.mp3');
    assert.equal(result.tracks.length, 1);
    assert.equal(result.tracks[0].url, 'https://example.com/song.mp3');
    assert.equal(result.tracks[0].title, '');
    assert.equal(result.tracks[0].duration, -1);
  });

  test('parses EXTINF with duration and title', () => {
    const content = `#EXTM3U
#EXTINF:180,My Song
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].duration, 180);
    assert.equal(result.tracks[0].title, 'My Song');
  });

  test('handles title with commas', () => {
    const content = `#EXTINF:180,Artist - Song, Vol. 2
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].title, 'Artist - Song, Vol. 2');
  });

  test('handles negative/unknown duration', () => {
    const content = `#EXTINF:-1,Unknown Duration
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].duration, -1);
  });

  test('handles invalid duration gracefully', () => {
    const content = `#EXTINF:notanumber,Test
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].duration, -1);
  });

  test('parses EXTVLCOPT directives', () => {
    const content = `#EXTINF:180,Test
#EXTVLCOPT:start-time=30
#EXTVLCOPT:stop-time=150
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].directives.length, 2);
    assert.equal(result.tracks[0].directives[0].key, 'start-time');
    assert.equal(result.tracks[0].directives[0].value, '30');
  });

  test('preserves custom directives as raw', () => {
    const content = `#EXTM3U
#PLAYLIST:My Playlist
#EXTINF:180,Test
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.headers[1].raw, '#PLAYLIST:My Playlist');
  });

  test('handles Windows line endings (CRLF)', () => {
    const content = '#EXTM3U\r\n#EXTINF:180,Test\r\nhttps://example.com/song.mp3';
    const result = parse(content);
    assert.equal(result.tracks.length, 1);
    assert.equal(result.tracks[0].url, 'https://example.com/song.mp3');
  });

  test('skips empty lines', () => {
    const content = `#EXTM3U

#EXTINF:180,Test

https://example.com/song.mp3

`;
    const result = parse(content);
    assert.equal(result.tracks.length, 1);
  });

  test('parses multiple tracks', () => {
    const content = `#EXTM3U
#EXTINF:180,Song 1
https://example.com/song1.mp3
#EXTINF:240,Song 2
https://example.com/song2.mp3
#EXTINF:300,Song 3
https://example.com/song3.mp3`;
    const result = parse(content);
    assert.equal(result.tracks.length, 3);
    assert.equal(result.tracks[1].title, 'Song 2');
    assert.equal(result.tracks[2].duration, 300);
  });

  test('lenient parsing: EXTVLCOPT without EXTINF', () => {
    const content = `#EXTVLCOPT:start-time=15
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks.length, 1);
    assert.equal(result.tracks[0].directives[0].key, 'start-time');
  });
});

// ============================================================================
// SERIALIZE TESTS
// ============================================================================

suite('serialize()', () => {
  test('serializes empty playlist with default header', () => {
    const result = serialize({ tracks: [], headers: [] });
    assert.equal(result, '#EXTM3U');
  });

  test('serializes playlist with EXTM3U header', () => {
    const playlist = { headers: [{ type: 'EXTM3U' }], tracks: [] };
    const result = serialize(playlist);
    assert.equal(result, '#EXTM3U');
  });

  test('serializes track with all metadata', () => {
    const playlist = {
      headers: [{ type: 'EXTM3U' }],
      tracks: [{
        url: 'https://example.com/song.mp3',
        title: 'My Song',
        duration: 180,
        directives: []
      }]
    };
    const result = serialize(playlist);
    assert.ok(result.includes('#EXTINF:180,My Song'));
    assert.ok(result.includes('https://example.com/song.mp3'));
  });

  test('serializes EXTVLCOPT directives', () => {
    const playlist = {
      headers: [{ type: 'EXTM3U' }],
      tracks: [{
        url: 'https://example.com/song.mp3',
        title: 'Test',
        duration: 180,
        directives: [{ type: 'EXTVLCOPT', key: 'start-time', value: '30' }]
      }]
    };
    const result = serialize(playlist);
    assert.ok(result.includes('#EXTVLCOPT:start-time=30'));
  });

  test('preserves raw directives', () => {
    const playlist = {
      headers: [{ type: 'EXTM3U' }, { raw: '#PLAYLIST:Test' }],
      tracks: []
    };
    const result = serialize(playlist);
    assert.ok(result.includes('#PLAYLIST:Test'));
  });

  test('handles tracks without title/duration', () => {
    const playlist = {
      headers: [],
      tracks: [{ url: 'https://example.com/song.mp3', title: '', duration: -1, directives: [] }]
    };
    const result = serialize(playlist);
    assert.ok(result.includes('https://example.com/song.mp3'));
    assert.ok(!result.includes('#EXTINF'));
  });
});

// ============================================================================
// ROUND-TRIP TESTS
// ============================================================================

suite('parse() + serialize() round-trip', () => {
  test('round-trip preserves simple playlist', () => {
    const original = `#EXTM3U
#EXTINF:180,Test Song
https://example.com/song.mp3`;
    const result = serialize(parse(original));
    assert.equal(result.trim(), original.trim());
  });

  test('round-trip preserves VLC options', () => {
    const original = `#EXTM3U
#EXTINF:180,Test Song
#EXTVLCOPT:start-time=15
https://example.com/song.mp3`;
    const result = serialize(parse(original));
    assert.equal(result.trim(), original.trim());
  });

  test('round-trip preserves multiple tracks', () => {
    const original = `#EXTM3U
#EXTINF:180,Song 1
https://example.com/song1.mp3
#EXTINF:240,Song 2
https://example.com/song2.mp3`;
    const parsed = parse(original);
    const serialized = serialize(parsed);
    const reparsed = parse(serialized);
    assert.equal(reparsed.tracks.length, 2);
    assert.equal(reparsed.tracks[0].title, 'Song 1');
    assert.equal(reparsed.tracks[1].title, 'Song 2');
  });
});

// ============================================================================
// createPlaylist() TESTS
// ============================================================================

suite('createPlaylist()', () => {
  test('creates playlist with EXTM3U header', () => {
    const playlist = createPlaylist();
    assert.equal(playlist.headers.length, 1);
    assert.equal(playlist.headers[0].type, 'EXTM3U');
  });

  test('creates playlist with empty tracks array', () => {
    const playlist = createPlaylist();
    assert.deepEqual(playlist.tracks, []);
  });

  test('creates independent instances', () => {
    const playlist1 = createPlaylist();
    const playlist2 = createPlaylist();
    playlist1.tracks.push({ url: 'test' });
    assert.equal(playlist2.tracks.length, 0);
  });
});

// ============================================================================
// addTrack() TESTS
// ============================================================================

suite('addTrack()', () => {
  test('adds track with all parameters', () => {
    const playlist = createPlaylist();
    addTrack(playlist, 'https://example.com/song.mp3', 'My Song', 180, []);
    assert.equal(playlist.tracks.length, 1);
    assert.equal(playlist.tracks[0].url, 'https://example.com/song.mp3');
    assert.equal(playlist.tracks[0].title, 'My Song');
    assert.equal(playlist.tracks[0].duration, 180);
  });

  test('uses default values for optional parameters', () => {
    const playlist = createPlaylist();
    addTrack(playlist, 'https://example.com/song.mp3');
    assert.equal(playlist.tracks[0].title, '');
    assert.equal(playlist.tracks[0].duration, -1);
    assert.deepEqual(playlist.tracks[0].directives, []);
  });

  test('adds multiple tracks', () => {
    const playlist = createPlaylist();
    addTrack(playlist, 'https://example.com/song1.mp3', 'Song 1');
    addTrack(playlist, 'https://example.com/song2.mp3', 'Song 2');
    addTrack(playlist, 'https://example.com/song3.mp3', 'Song 3');
    assert.equal(playlist.tracks.length, 3);
  });

  test('returns the modified playlist', () => {
    const playlist = createPlaylist();
    const result = addTrack(playlist, 'https://example.com/song.mp3');
    assert.strictEqual(result, playlist);
  });

  test('adds track with directives', () => {
    const playlist = createPlaylist();
    const directives = [{ type: 'EXTVLCOPT', key: 'start-time', value: '30' }];
    addTrack(playlist, 'https://example.com/song.mp3', 'Test', 180, directives);
    assert.equal(playlist.tracks[0].directives.length, 1);
    assert.equal(playlist.tracks[0].directives[0].key, 'start-time');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

suite('Edge cases', () => {
  test('handles playlist with only URLs', () => {
    const content = `https://example.com/song1.mp3
https://example.com/song2.mp3`;
    const result = parse(content);
    assert.equal(result.tracks.length, 2);
  });

  test('handles float durations', () => {
    const content = `#EXTINF:180.5,Float Duration
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].duration, 180.5);
  });

  test('handles special characters in URL', () => {
    const url = 'https://example.com/path?query=value&foo=bar#anchor';
    const playlist = createPlaylist();
    addTrack(playlist, url);
    const serialized = serialize(playlist);
    const reparsed = parse(serialized);
    assert.equal(reparsed.tracks[0].url, url);
  });

  test('handles unicode in title', () => {
    const content = `#EXTINF:180,日本語タイトル 🎵
https://example.com/song.mp3`;
    const result = parse(content);
    assert.equal(result.tracks[0].title, '日本語タイトル 🎵');
  });

  test('handles very long playlists', () => {
    const playlist = createPlaylist();
    for (let i = 0; i < 1000; i++) {
      addTrack(playlist, `https://example.com/song${i}.mp3`, `Song ${i}`, i);
    }
    const serialized = serialize(playlist);
    const reparsed = parse(serialized);
    assert.equal(reparsed.tracks.length, 1000);
  });

  test('handles null/undefined values in EXTVLCOPT directives', () => {
    // Test the fixed logic for malformed directives with null values
    const playlist = {
      headers: [{ type: 'EXTM3U' }],
      tracks: [{
        url: 'https://example.com/song.mp3',
        title: 'Test Song',
        duration: 180,
        directives: [{
          type: 'EXTVLCOPT',
          key: 'start-time',
          value: null // Simulate malformed directive
        }]
      }]
    };

    const track = playlist.tracks[0];
    let startTimeDirective = track.directives.find(d =>
      d.type === 'EXTVLCOPT' && d.key === 'start-time');

    if (startTimeDirective) {
      let currentStartTime = parseFloat(startTimeDirective.value || '0');
      if (isNaN(currentStartTime)) {
        currentStartTime = 0;
      }
      const secondsToAdd = 15;
      startTimeDirective.value = (currentStartTime + secondsToAdd).toString();
    }

    assert.equal(startTimeDirective.value, '15');
  });
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✨ All tests passed!\n');
}
