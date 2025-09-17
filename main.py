import os
import json
from pathlib import Path
from typing import List, Dict, Any

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code repo
# and add the `decky-loader/plugin/imports` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky
import asyncio

class Plugin:
    def __init__(self):
        self.rom_directory = os.path.expanduser("~/Downloads")
        self.supported_extensions = ['.gb', '.gbc']
    
    # Scan for Game Boy ROM files in the Downloads directory
    async def scan_roms(self) -> List[Dict[str, Any]]:
        try:
            rom_files = []
            rom_dir = Path(self.rom_directory)
            
            if not rom_dir.exists():
                decky.logger.warning(f"ROM directory does not exist: {self.rom_directory}")
                return []
            
            # Scan for ROM files with supported extensions
            for ext in self.supported_extensions:
                for rom_file in rom_dir.glob(f"*{ext}"):
                    if rom_file.is_file():
                        try:
                            file_size = rom_file.stat().st_size
                            rom_info = {
                                "name": rom_file.name,
                                "fullPath": str(rom_file),
                                "size": file_size,
                                "title": self._extract_rom_title(rom_file) or rom_file.stem.upper()
                            }
                            rom_files.append(rom_info)
                            decky.logger.info(f"Found ROM: {rom_file.name} ({file_size} bytes)")
                        except Exception as e:
                            decky.logger.error(f"Error processing ROM file {rom_file}: {e}")
            
            decky.logger.info(f"Found {len(rom_files)} ROM files in {self.rom_directory}")
            return rom_files
            
        except Exception as e:
            decky.logger.error(f"Failed to scan ROM directory: {e}")
            return []
    
    # Load ROM file data
    async def load_rom(self, rom_path: str) -> List[int]:
        try:
            file_path = Path(rom_path)
            
            # Security check - make sure the file is in the expected directory
            if not str(file_path.resolve()).startswith(str(Path(self.rom_directory).resolve())):
                raise ValueError("ROM file must be in the Downloads directory")
            
            if not file_path.exists():
                raise FileNotFoundError(f"ROM file not found: {rom_path}")
            
            # Read the ROM file and convert to list of integers for JSON serialization
            with open(file_path, 'rb') as f:
                rom_data = f.read()
            
            # Convert bytes to list of integers for JSON serialization
            rom_data_list = list(rom_data)
            
            decky.logger.info(f"Loaded ROM: {file_path.name} ({len(rom_data)} bytes)")
            return rom_data_list
            
        except Exception as e:
            decky.logger.error(f"Failed to load ROM {rom_path}: {e}")
            raise
    
    # Extract ROM title from header (Game Boy ROM header is at 0x134-0x142)
    def _extract_rom_title(self, rom_path: Path) -> str:
        try:
            with open(rom_path, 'rb') as f:
                # Seek to ROM title location
                f.seek(0x134)
                title_bytes = f.read(16)  # Title can be up to 16 bytes
                
                # Convert to string and remove null bytes
                title = title_bytes.decode('ascii', errors='ignore').rstrip('\x00')
                return title if title else None
                
        except Exception as e:
            decky.logger.debug(f"Could not extract title from {rom_path.name}: {e}")
            return None

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.loop = asyncio.get_event_loop()
        decky.logger.info("Deck Boy DMG plugin loaded!")

    # Function called first during the unload process, utilize this to handle your plugin being stopped, but not
    # completely removed
    async def _unload(self):
        decky.logger.info("Goodnight World!")
        pass

    # Function called after `_unload` during uninstall, utilize this to clean up processes and other remnants of your
    # plugin that may remain on the system
    async def _uninstall(self):
        decky.logger.info("Goodbye World!")
        pass

    async def start_timer(self):
        self.loop.create_task(self.long_running())

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky.logger.info("Migrating")
        # Here's a migration example for logs:
        # - `~/.config/decky-template/template.log` will be migrated to `decky.decky_LOG_DIR/template.log`
        decky.migrate_logs(os.path.join(decky.DECKY_USER_HOME,
                                               ".config", "decky-template", "template.log"))
        # Here's a migration example for settings:
        # - `~/homebrew/settings/template.json` is migrated to `decky.decky_SETTINGS_DIR/template.json`
        # - `~/.config/decky-template/` all files and directories under this root are migrated to `decky.decky_SETTINGS_DIR/`
        decky.migrate_settings(
            os.path.join(decky.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky.DECKY_USER_HOME, ".config", "decky-template"))
        # Here's a migration example for runtime data:
        # - `~/homebrew/template/` all files and directories under this root are migrated to `decky.decky_RUNTIME_DIR/`
        # - `~/.local/share/decky-template/` all files and directories under this root are migrated to `decky.decky_RUNTIME_DIR/`
        decky.migrate_runtime(
            os.path.join(decky.DECKY_HOME, "template"),
            os.path.join(decky.DECKY_USER_HOME, ".local", "share", "decky-template"))
