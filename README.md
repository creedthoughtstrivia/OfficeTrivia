# Creed Thoughts Trivia — Mega Edition

This version of the Creed Thoughts trivia game builds on the enhanced edition by
adding a 500‑question mega pack, improved sound effects, and a simple Python
server script.  It preserves the polished bar‑themed interface, live
multiplayer tournaments with host controls, solo leaderboards, and an admin
panel.  To enjoy all features, follow the instructions below.

## New features

* **Mega Mixed Pack (500 Questions)** — a new question set combining 100
  trivia questions about *The Office* and 400 dynamically generated
  arithmetic questions.  Load this set from the question set dropdown in
  Solo Play or when creating a Live Match.
* **Improved sound** — audio feedback now uses frequency sweeps with an
  exponential decay, giving correct answers a pleasant ascending tone and
  wrong answers a descending tone.  Clicks trigger a short neutral chirp.
* **Local server script** — run `serve.py` to start a quiet HTTP server on
  port 8000.  This simplifies starting the game without needing to recall
  Python or Node commands.

## Running the game

Modern browsers block ES module imports when pages are loaded directly from
disk (the `file://` protocol).  To play the game with live multiplayer and
sound, you must serve the files over HTTP.  Two easy options are provided:

1. **Using the built‑in Python server**

   1. Open a terminal in the `enhanced_game_v3` folder.
   2. Run:

      ```bash
      python3 serve.py
      ```

   3. Open your browser and visit `http://localhost:8000/index.html`.

2. **Using Python’s standard HTTP server**

   If you prefer a one‑liner, you can run:

   ```bash
   python3 -m http.server 8000
   ```

   Then browse to `http://localhost:8000`.

Once the server is running, the Solo Play dropdown will populate with all
available question sets, including the new mega pack.  Sound effects will play
after your first interaction (browsers require a user gesture to resume the
audio context).

## Firebase configuration

To enable remote leaderboards and live tournaments that sync across devices,
create a Firebase project and replace the placeholder values in
`js/config.js`.  Set `enabled` to `true`.  Without Firebase configured, the
leaderboard will work locally in your browser only and live matches will not
function.

## Extending the game

* **More question sets** — drop JSON files into `questions/` and add their
  metadata to `js/config.js` under `APP.QUESTION_SETS`.
* **Custom audio** — replace the synthesised tones by loading audio files
  from `assets/audio/` and updating `js/sound.js` to play them.
* **Additional game modes** — the code is modular; feel free to add new
  pages or enhance existing ones with achievements, hints, or Easter eggs.

Enjoy your trivia night and let us know what other features you’d like to see!