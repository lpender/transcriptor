"""Static dev server on :8799 that never lets the browser cache a file.

`python3 -m http.server` sends Last-Modified and no Cache-Control, so a browser
heuristically caches index.html and a redirect back from the API (sign-in,
billing) lands on a stale copy. Same tree, same port, plus Cache-Control: no-store.
"""
import http.server, sys

class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

http.server.test(HandlerClass=NoStore, port=int(sys.argv[1]) if len(sys.argv) > 1 else 8799)
