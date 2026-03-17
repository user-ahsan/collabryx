#!/usr/bin/env python3
"""
Collabryx Interactive Database Seeder
Menu-driven seeding system with arrow key navigation and multi-selection

Usage:
    python main.py
    # Then press 'A' for interactive menu or use number keys for quick access
"""

import sys
import os
from datetime import datetime
from colorama import Fore, Style, init

# Initialize colorama
init()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config


def main():
    """Main entry point - launch interactive menu"""
    print(f"\n{Fore.CYAN}")
    print("=" * 70)
    print("  COLLABRYX INTERACTIVE DATABASE SEEDER")
    print("  Arrow keys to navigate, SPACE to select, ENTER to execute")
    print("=" * 70)
    print(f"{Style.RESET_ALL}\n")

    # Launch interactive menu directly
    from interactive_menu import run_interactive_seeder

    run_interactive_seeder()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Fore.YELLOW}Interrupted by user{Style.RESET_ALL}")
        sys.exit(0)
