"""
Simple HTTP server for the Creed Thoughts trivia game.

Run this script from within the ``enhanced_game_v3`` directory to host the
game locally.  Using a server is necessary for features like the live
multiplayer mode and Firebase integration, which do not work correctly when
loading HTML files via the ``file://`` protocol.  To start the server, run:

    python3 serve.py

and then visit ``http://localhost:8000`` in your web browser.

If port 8000 is already in use, change the ``PORT`` constant below.
"""
import http.server
import socketserver
import os


PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """A request handler that suppresses log messages for cleanliness."""
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__))
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"Serving Creed Thoughts trivia at http://localhost:{PORT}/")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")