# Creed Thoughts Trivia — Enhanced Edition

This enhanced version of the Creed Thoughts trivia game adds a bar‑themed user interface, sound effects, live multiplayer tournaments and an admin panel while maintaining all of the original features. To enjoy the game fully, follow the instructions below.

## Running the game

Because the code is organised as ES modules (each JavaScript file imports other files), modern browsers enforce that these files be served over a local HTTP server. Loading pages directly from the `file://` protocol will prevent the scripts from running, which is why you may see empty dropdowns or silent audio.

To run the game locally:

1. Open a terminal in the `enhanced_game` folder (where this README lives).
2. Start a simple HTTP server. You can use either Python or Node.js:

   ### Using Python (version 3)

   ```bash
   python3 -m http.server 8000
   ```

   ### Using Node.js

   If you have `npm` installed, install `http-server` once with:

   ```bash
   npm install -g http-server
   ```

   Then start the server:

   ```bash
   http-server -p 8000
   ```

3. Once the server is running, open your browser and navigate to `http://localhost:8000/index.html`.

You should now see the bar background with working dropdowns and hear the sound effects when you click buttons or answer questions.

## Configuring Firebase

For leaderboard persistence and live tournament functionality you will need a Firebase project. Open `js/config.js` and replace the placeholder values under `FB.config` with your own Firebase credentials, then set `enabled: true`.

## Adding question sets

Question sets live in the `questions/` folder as JSON files. To add more trivia categories, place new JSON files in that directory and list them in `js/config.js` under `APP.QUESTION_SETS`.

## Trouble shooting

* **Empty dropdown or no sound** — make sure you are accessing the pages via `http://localhost` and not `file://` URLs. Modules cannot be loaded directly from disk.
* **No audio** — browsers often require a user gesture before audio can play. After clicking a button once the sound system will initialise. We use a single `AudioContext` and resume it automatically on interaction.

Enjoy your trivia night!