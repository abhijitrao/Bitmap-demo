import ctypes
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP_NAME = "Bitmap Parser"
HOST = "127.0.0.1"
PORT = 8765
MUTEX_NAME = r"Local\BitmapParserChromeBasedExe"
PROFILE_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "BitmapParser" / "ChromeProfile"


def show_message(title, message, error=False):
    flags = 0x10 if error else 0x40
    ctypes.windll.user32.MessageBoxW(None, message, title, flags)


def acquire_single_instance():
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateMutexW.argtypes = [wintypes.LPVOID, wintypes.BOOL, wintypes.LPCWSTR]
    kernel32.CreateMutexW.restype = wintypes.HANDLE
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    handle = kernel32.CreateMutexW(None, False, MUTEX_NAME)
    if not handle:
        show_message(APP_NAME, "Could not initialize the application.", True)
        return None
    if ctypes.get_last_error() == 183:  # ERROR_ALREADY_EXISTS
        show_message(APP_NAME, "Bitmap Parser is already running in Chrome.")
        kernel32.CloseHandle(handle)
        return None
    return handle


def resource_directory():
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent


def find_chrome():
    candidates = [
        Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Google/Chrome/Application/chrome.exe",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return shutil.which("chrome") or shutil.which("google-chrome")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


def main():
    mutex = acquire_single_instance()
    if not mutex:
        return

    try:
        root = resource_directory()
        if not (root / "index.html").is_file():
            show_message(APP_NAME, "Application files are missing. Please reinstall the application.", True)
            return

        chrome = find_chrome()
        if not chrome:
            show_message(APP_NAME, "Google Chrome was not found. Please install Chrome and try again.", True)
            return

        try:
            with socket.create_connection((HOST, PORT), timeout=0.5):
                show_message(APP_NAME, f"Port {PORT} is already in use. Close the other application and try again.", True)
                return
        except OSError:
            pass

        handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(root), **kwargs)
        server = ThreadingHTTPServer((HOST, PORT), handler)
        server.daemon_threads = True
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        url = f"http://{HOST}:{PORT}/"
        command = [
            chrome,
            f"--user-data-dir={PROFILE_DIR}",
            f"--app={url}",
            "--no-first-run",
            "--disable-background-mode",
            "--disable-features=Translate",
        ]

        try:
            browser = subprocess.Popen(command, close_fds=True)
            # A dedicated Chrome profile gives this app its own persistent LocalStorage.
            browser.wait()
        except Exception as exc:
            show_message(APP_NAME, f"Unable to launch Google Chrome:\n{exc}", True)
        finally:
            server.shutdown()
            server.server_close()
    finally:
        ctypes.WinDLL("kernel32", use_last_error=True).CloseHandle(mutex)


if __name__ == "__main__":
    main()
