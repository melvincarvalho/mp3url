/**
 * mp3url - M3U parsing and serialization library
 * @module mp3url
 */

/**
 * Parse an M3U file content into a JSON object
 * @param {string} content - M3U file content
 * @returns {Object} Parsed playlist object
 */
export function parse (content) {
  const lines = content.split(/\r?\n/);
  const playlist = {
    tracks: [],
    headers: []
  };

  let currentTrack = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    if (line.startsWith('#')) {
      // Handle extended info
      if (line.startsWith('#EXTINF:')) {
        // Format: #EXTINF:duration,title
        const infoLine = line.substring(8);
        const [durationStr, ...titleParts] = infoLine.split(',');
        const title = titleParts.join(',');
        const duration = parseFloat(durationStr);

        currentTrack = {
          url: '',
          title: title || '',
          duration: isNaN(duration) ? -1 : duration,
          directives: []
        };
      }
      // Handle EXTVLCOPT directives
      else if (line.startsWith('#EXTVLCOPT:')) {
        const directive = line.substring(11);
        const [key, value] = directive.split('=');

        // Create a new track if none exists - being lenient
        if (!currentTrack) {
          currentTrack = {
            url: '',
            title: '',
            duration: -1,
            directives: []
          };
        }

        currentTrack.directives.push({
          type: 'EXTVLCOPT',
          key,
          value
        });
      }
      // Handle EXTM3U header
      else if (line === '#EXTM3U') {
        playlist.headers.push({
          type: 'EXTM3U'
        });
      }
      // Handle other directives
      else {
        const directive = {
          raw: line
        };

        if (currentTrack) {
          currentTrack.directives.push(directive);
        } else {
          playlist.headers.push(directive);
        }
      }
    } else {
      // This is a URL/path line
      if (currentTrack) {
        currentTrack.url = line;
        playlist.tracks.push(currentTrack);
        currentTrack = null;
      } else {
        // Simple track without extended info
        playlist.tracks.push({
          url: line,
          title: '',
          duration: -1,
          directives: []
        });
      }
    }
  }

  return playlist;
}

/**
 * Serialize a playlist object back to M3U format
 * @param {Object} playlist - The playlist object
 * @returns {string} M3U formatted string
 */
export function serialize (playlist) {
  const lines = [];

  // Add headers
  if (playlist.headers && playlist.headers.length > 0) {
    playlist.headers.forEach(header => {
      if (header.type === 'EXTM3U') {
        lines.push('#EXTM3U');
      } else if (header.raw) {
        lines.push(header.raw);
      }
    });
  } else {
    // Add default header if none exists
    lines.push('#EXTM3U');
  }

  // Add tracks
  if (playlist.tracks && playlist.tracks.length > 0) {
    playlist.tracks.forEach(track => {
      // Add directives that should appear before EXTINF
      const preDirectives = track.directives ? track.directives.filter(d =>
        d.raw && !d.type && d.raw.startsWith('#EXT')) : [];

      preDirectives.forEach(directive => {
        lines.push(directive.raw);
      });

      // Add EXTINF line if we have duration or title
      if (track.duration > -1 || track.title) {
        lines.push(`#EXTINF:${track.duration > -1 ? track.duration : 0},${track.title || ''}`);
      }

      // Add EXTVLCOPT directives
      const vlcOpts = track.directives ? track.directives.filter(d => d.type === 'EXTVLCOPT') : [];
      vlcOpts.forEach(opt => {
        lines.push(`#EXTVLCOPT:${opt.key}=${opt.value}`);
      });

      // Add other directives
      const otherDirectives = track.directives ? track.directives.filter(d =>
        d.raw && !d.type && !d.raw.startsWith('#EXT')) : [];

      otherDirectives.forEach(directive => {
        lines.push(directive.raw);
      });

      // Add URL
      if (track.url) {
        lines.push(track.url);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Create a new empty playlist
 * @returns {Object} Empty playlist object
 */
export function createPlaylist () {
  return {
    headers: [{
      type: 'EXTM3U'
    }],
    tracks: []
  };
}

/**
 * Add a track to a playlist
 * @param {Object} playlist - The playlist to modify
 * @param {string} url - URL or path to the media file
 * @param {string} [title] - Optional track title
 * @param {number} [duration] - Optional track duration in seconds
 * @param {Array} [directives] - Optional array of directives
 * @returns {Object} The modified playlist
 */
export function addTrack (playlist, url, title = '', duration = -1, directives = []) {
  playlist.tracks.push({
    url,
    title,
    duration,
    directives
  });

  return playlist;
} 