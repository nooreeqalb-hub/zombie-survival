"""
Zombie Survival - Main Entry Point
Real Human Player + Minecraft Block Zombie
"""

import http.server
import socketserver
import os
import webbrowser
from accessibility import get_accessibility_config, check_accessibility

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    print("="*50)
    print("ZOMBIE SURVIVAL - HUMAN HERO GAME")
    print("="*50)
    
    # Accessibility Check
    print("\n[ Accessibility Check ]")
    checks = check_accessibility()
    for k, v in checks.items():
        print(f"  {v} - {k}")
    
    config = get_accessibility_config()
    print(f"\n[ Game Config ]")
    print(f"  Title: {config['game_title']}")
    print(f"  Player: Real human with SMG")
    print(f"  Zombie: Minecraft block head")
    print(f"  Controls: 140px Joystick + 120px Shoot")
    print(f"  Map: 90x90 Mini Map")
    
    print(f"\n[ Starting Server on port {PORT} ]")
    
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"  Serving at http://localhost:{PORT}")
        print(f"  Open http://localhost:{PORT}/index.html")
        print(f"\n  Player.png: Real human image")
        print(f"  Zombie.png: Block zombie image")
        print("\n  Press Ctrl+C to stop")
        
        # Auto open browser
        try:
            webbrowser.open(f"http://localhost:{PORT}/index.html")
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped. Bye!")

if __name__ == "__main__":
    main()
