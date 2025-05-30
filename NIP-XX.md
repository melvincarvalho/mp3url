# NIP-XX — Sharing `.m3u` Playlists via Event Content

**Author:** Melvin Carvalho
**Status:** Draft
**Type:** Standard
**Created:** 2025-05-30
**License:** Public Domain

---

## Abstract

This NIP proposes a convention for embedding `.m3u` (or `.m3u8`) playlist data directly in the content field of a Nostr event, enabling lightweight media playlist sharing and interoperability across Nostr clients.

---

## Motivation

Music and media curation is a core part of internet culture. By supporting `.m3u` playlists in Nostr events, clients can display or play a stream of media from a user without additional protocol complexity. It enables community radio, shared mixtapes, curated video queues, and more — all within Nostr's existing event model.

---

## Event Kind

This NIP recommends a new kind value:

* `30313` — M3U Playlist Event (ephemeral or persistent)

> Alternatively, clients MAY use a generic kind (e.g. `1`) if playlists are mixed with textual commentary.

---

## Content Format

The `content` field MUST contain a valid `.m3u` or `.m3u8` text format. Clients SHOULD treat it as UTF-8. It MAY begin with `#EXTM3U` and include lines of metadata and media URLs.

### Example

```json
{
  "kind": 30313,
  "content": "#EXTM3U\n#EXTINF:123, Sample artist - Sample title\nhttp://www.example.com/music/sample.mp3\n#EXTINF:321, Another track\nhttps://ipfs.io/ipfs/QmExample",
  "tags": [["d", "lofi-mixtape"], ["alt", "M3U playlist"]]
}
```

---

## Tags

The following tags are RECOMMENDED:

* `d` (descriptor): A short name or label for the playlist.
* `alt`: Human-readable description.
* `t` (optional): Tags/keywords (e.g. genre).
* `u` (optional): Source URL if playlist is mirrored elsewhere (e.g. NosDAV, Blossom, HTTP).

---

## Client Behavior

Clients that support this NIP:

* MAY detect if the content is valid `.m3u` and render a "Play Playlist" button or embedded player.
* SHOULD sanitize and filter URLs before autoplaying.
* MAY cache or prefetch media responsibly.
* MAY provide export options to `.m3u` files.
* MAY expand nevent strings.

---

## Extensions

* **Live updates**: Combine with other kinds for real-time, collaborative playlist editing.
* **IPTV**: Compatible with IPTV

---

## Security Considerations

* Clients MUST validate and sandbox media URLs to avoid unsafe redirects or autoplay abuse.
* Events SHOULD NOT be used to store large media files directly; only references (e.g. URLs or IPFS hashes) are recommended.
* Respect copyright and licensing of referenced media.

---

## Compatibility

This format is compatible with `.m3u`-aware players and can be exported for use in VLC, Winamp, and web-based streamers. Clients without media support will still display the raw text or a download link.

---

## Copyright

This NIP is released into the public domain.

