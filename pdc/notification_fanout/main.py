#!/usr/bin/env python3
"""
Notification Fanout Simulation — Interactive Terminal Menu

Arrow-key menu for configuring and running the fanout simulation.
    python pdc/notification_fanout/main.py
"""

import sys
import os
import time
import msvcrt
import logging
from multiprocessing import cpu_count
from collections import defaultdict

from colorama import Fore, Style, init

# ── Import simulation modules (sibling imports) ─────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
import simulation
import plots

init()
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# ── Configuration State ─────────────────────────────────────────────────

DEFAULTS = {
    "notifications": 50,
    "users": 100,
    "strategies": ["sequential", "thread", "process", "gossip"],
    "seed": 42,
    "gen_plots": True,
}

config = dict(DEFAULTS)

STRATEGY_NAMES = {
    "sequential": "Sequential (baseline)",
    "thread": "Thread Pool",
    "process": "Process Pool",
    "gossip": "Gossip (epidemic)",
}


def strategy_label(name: str) -> str:
    return STRATEGY_NAMES.get(name, name)


# ── Keyboard / Terminal Utilities ───────────────────────────────────────


def get_arrow_key():
    try:
        if not msvcrt.kbhit():
            return None
        key = msvcrt.getch()
        if key in (b"\xe0", b"\x00"):
            k2 = msvcrt.getch()
            if k2 in (b"H", b"K"):
                return "up"
            if k2 in (b"P", b"M"):
                return "down"
        elif key == b" ":
            return "space"
        elif key in (b"\r", b"\n"):
            return "enter"
        elif key.lower() == b"q":
            return "q"
        elif key == b"\x1b":
            return "esc"
    except:
        pass
    return None


def clear_screen():
    print("\033[2J\033[H", end="")
    print("\033[?25l", end="")


def show_cursor():
    print("\033[?25h", end="")


def press_enter():
    print(Fore.YELLOW + "\nPress Enter to continue..." + Style.RESET_ALL, end="")
    while True:
        k = get_arrow_key()
        if k in ("enter", "space"):
            break
        time.sleep(0.05)


def input_int(prompt: str, default: int, lo: int, hi: int) -> int:
    """Ask user for an integer value with range validation."""
    show_cursor()
    while True:
        raw = input(Fore.CYAN + f"{prompt} [{default}]: " + Style.RESET_ALL).strip()
        if not raw:
            return default
        try:
            val = int(raw)
            if lo <= val <= hi:
                return val
            print(Fore.RED + f"  Enter a number between {lo} and {hi}." + Style.RESET_ALL)
        except ValueError:
            print(Fore.RED + "  Enter a valid integer." + Style.RESET_ALL)


def input_seed(prompt: str, default: int) -> int:
    """Ask user for a random seed."""
    show_cursor()
    while True:
        raw = input(Fore.CYAN + f"{prompt} [{default}]: " + Style.RESET_ALL).strip()
        if not raw:
            return default
        try:
            return int(raw)
        except ValueError:
            print(Fore.RED + "  Enter a valid integer seed." + Style.RESET_ALL)


# ── Menu Class ──────────────────────────────────────────────────────────


class Menu:
    def __init__(self, title, options, allow_multi=True):
        self.title = title
        self.options = options
        self.selected = 0
        self.checked = set()
        self.allow_multi = allow_multi

    def draw(self):
        clear_screen()
        print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
        print(Fore.CYAN + self.title + Style.RESET_ALL)
        print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
        print()
        if self.allow_multi:
            print(Fore.YELLOW + "Controls: UP/DOWN arrows, SPACE to select, ENTER to run, Q to quit" + Style.RESET_ALL)
            print()
        for i, opt in enumerate(self.options):
            label = opt["label"]
            if opt.get("separator"):
                if i == self.selected:
                    print(Fore.GREEN + ">>" + Style.RESET_ALL + "  " + Fore.CYAN + label + Style.RESET_ALL)
                else:
                    print("    " + Fore.CYAN + label + Style.RESET_ALL)
                continue
            if i == self.selected:
                marker = Fore.GREEN + ">>" + Style.RESET_ALL
                status = Fore.GREEN + "[X]" + Style.RESET_ALL if i in self.checked else "   "
                print(f"{marker} {status} {label}")
                if "warning" in opt:
                    print(Fore.RED + f"      WARNING: {opt['warning']}" + Style.RESET_ALL)
            else:
                chk = Fore.GREEN + "X" + Style.RESET_ALL if i in self.checked else " "
                print(f"       [{chk}] {label}")
        print()
        print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
        if self.checked:
            print(Fore.GREEN + f"Selected: {len(self.checked)} item(s)" + Style.RESET_ALL)

    def run(self):
        self.draw()
        while True:
            time.sleep(0.05)
            key = get_arrow_key()
            if key == "up":
                self.selected = max(0, self.selected - 1)
                self.draw()
            elif key == "down":
                self.selected = min(len(self.options) - 1, self.selected + 1)
                self.draw()
            elif key == "space" and self.allow_multi:
                opt = self.options[self.selected]
                if opt.get("separator"):
                    continue
                if self.selected in self.checked:
                    self.checked.remove(self.selected)
                else:
                    self.checked.add(self.selected)
                self.draw()
            elif key == "enter":
                show_cursor()
                if self.allow_multi:
                    return [self.options[i] for i in self.checked]
                else:
                    return [self.options[self.selected]]
            elif key in ("q", "esc"):
                show_cursor()
                return []


# ── Simulation Runner ───────────────────────────────────────────────────


def run_simulation_once() -> dict | None:
    """Run the simulation with current config."""
    show_cursor()
    notify_count = config["notifications"]
    user_count = config["users"]
    strategies = config["strategies"]
    seed = config["seed"]

    print(f"\n{'='*60}")
    print(f"  Notification Fanout Simulation")
    print(f"{'='*60}")
    print(f"  Notifications: {notify_count}")
    print(f"  Users:         {user_count}")
    print(f"  Strategies:    {', '.join(strategy_label(s) for s in strategies)}")
    print(f"  Seed:          {seed}")
    print(f"{'='*60}\n")

    print(Fore.CYAN + f"[CPU] Cores detected: {cpu_count()}" + Style.RESET_ALL + "\n")

    results = simulation.run_simulation(
        notification_count=notify_count,
        user_count=user_count,
        strategies=strategies,
        seed=seed,
    )

    simulation.print_report(results)

    if config["gen_plots"] and results:
        plots.generate_all_plots(results)

    return results


def run_scaling_analysis():
    """Run simulations across multiple user counts."""
    show_cursor()
    strategies = config["strategies"]
    seed = config["seed"]
    notify_count = config["notifications"]
    user_counts = [10, 25, 50, 100, 200, 500]

    print(f"\n{'='*60}")
    print(f"  Scaling Analysis — Sweeping User Count")
    print(f"{'='*60}")
    print(f"  Notifications per run: {notify_count}")
    print(f"  Strategies:            {', '.join(strategy_label(s) for s in strategies)}")
    print(f"  User counts:           {', '.join(str(uc) for uc in user_counts)}")
    print(f"{'='*60}\n")

    print(Fore.CYAN + f"[CPU] Cores detected: {cpu_count()}" + Style.RESET_ALL + "\n")

    all_results: dict[int, dict] = {}
    for uc in user_counts:
        print(f"  ── Users: {uc} ──")
        results = simulation.run_simulation(
            notification_count=notify_count,
            user_count=uc,
            strategies=strategies,
            seed=seed,
        )
        all_results[uc] = results

    if config["gen_plots"] and all_results:
        # Plot scaling curves
        last_results = list(all_results.values())[-1]
        plots.generate_all_plots(last_results)

        by_strategy: dict[str, dict[int, simulation.DeliveryReport]] = defaultdict(dict)
        for uc, results in all_results.items():
            for name, report in results.items():
                by_strategy[name][uc] = report
        plots.plot_scaling_with_users(by_strategy)

    return all_results


# ── Menu Functions ──────────────────────────────────────────────────────


def show_config():
    """Display current configuration in a box."""
    print(Fore.CYAN + "─" * 50 + Style.RESET_ALL)
    print(Fore.YELLOW + "  CURRENT CONFIGURATION" + Style.RESET_ALL)
    print(Fore.CYAN + "─" * 50 + Style.RESET_ALL)
    print(f"  Notifications:   {config['notifications']}")
    print(f"  Users:           {config['users']}")
    print(f"  Strategies:      {', '.join(strategy_label(s) for s in config['strategies'])}")
    print(f"  Seed:            {config['seed']}")
    print(f"  Generate plots:  {'Yes' if config['gen_plots'] else 'No'}")
    print(Fore.CYAN + "─" * 50 + Style.RESET_ALL)


def menu_configure():
    """Submenu: configure and run simulation."""
    while True:
        status = (Fore.GREEN + "Yes" + Style.RESET_ALL) if config["gen_plots"] else Fore.RED + "No" + Style.RESET_ALL
        strat_list = ", ".join(strategy_label(s) for s in config["strategies"])
        opts = [
            {"label": "▶  RUN SIMULATION"},
            {"label": "──────────────────────────────────────", "separator": True},
            {"label": f"Notifications:    {config['notifications']}"},
            {"label": f"Users:            {config['users']}"},
            {"label": f"Strategies:       {strat_list}"},
            {"label": f"Seed:             {config['seed']}"},
            {"label": f"Generate plots:   {'Yes' if config['gen_plots'] else 'No'}"},
            {"label": "──────────────────────────────────────", "separator": True},
            {"label": "Reset to defaults"},
            {"label": "← Back"},
        ]
        m = Menu("CONFIGURE & RUN SIMULATION", opts, allow_multi=False)
        sel = m.run()
        if not sel:
            return
        label = sel[0]["label"]

        if "RUN SIMULATION" in label:
            run_simulation_once()
            press_enter()

        elif "Notifications:" in label:
            config["notifications"] = input_int("Notification count", config["notifications"], 1, 10000)

        elif "Users:" in label:
            config["users"] = input_int("User count per notification", config["users"], 1, 100000)

        elif "Strategies:" in label:
            menu_strategies()

        elif "Seed:" in label:
            config["seed"] = input_seed("Random seed", config["seed"])

        elif "Generate plots:" in label:
            config["gen_plots"] = not config["gen_plots"]

        elif "Reset" in label:
            config.clear()
            config.update(DEFAULTS)

        elif "Back" in label:
            return


def menu_strategies():
    """Multi-select submenu for choosing strategies."""
    opts = []
    for key in ["sequential", "thread", "process", "gossip"]:
        selected = key in config["strategies"]
        label = f"{strategy_label(key)}"
        marker = Fore.GREEN + "[X]" + Style.RESET_ALL if selected else "   "
        opts.append({"label": marker + " " + label, "_key": key})

    opts.append({"label": "──────────────────────────", "separator": True})
    opts.append({"label": "✓ Done"})

    m = Menu("SELECT STRATEGIES", opts, allow_multi=True)
    sel = m.run()
    if sel is None:
        return

    # Toggle logic
    checked_keys = set()
    for item in sel:
        if item.get("_key"):
            checked_keys.add(item["_key"])
        elif "Done" in item["label"]:
            # Apply selection: re-run with checked keys
            config["strategies"] = [k for k in ["sequential", "thread", "process", "gossip"] if k in checked_keys]
            if not config["strategies"]:
                config["strategies"] = ["sequential"]  # fallback
            return

    # If user pressed Q/ESC, keep current selection
    if sel == []:
        return


def menu_about():
    """Display information about the simulation strategies."""
    show_cursor()
    clear_screen()
    print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
    print(Fore.CYAN + "  NOTIFICATION FANOUT — STRATEGY REFERENCE" + Style.RESET_ALL)
    print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
    print()
    print(Fore.YELLOW + "  1. SEQUENTIAL (baseline)" + Style.RESET_ALL)
    print("     Deliver each notification to all recipients one-by-one.")
    print("     No parallelism. Measures the serial portion of the workload.")
    print()
    print(Fore.YELLOW + "  2. THREAD POOL" + Style.RESET_ALL)
    print("     Parallel delivery via ThreadPoolExecutor.")
    print("     Best for I/O-bound work. Shows GIL limitations for CPU work.")
    print()
    print(Fore.YELLOW + "  3. PROCESS POOL" + Style.RESET_ALL)
    print("     Parallel delivery via ProcessPoolExecutor (separate processes).")
    print("     Bypasses the GIL. True parallelism with IPC overhead.")
    print()
    print(Fore.YELLOW + "  4. GOSSIP (epidemic)" + Style.RESET_ALL)
    print("     Peer-to-peer propagation — each node tells 3 others,")
    print("     who tell 3 others, etc. Models DynamoDB/Cassandra/Blockchain.")
    print("     Trades message redundancy for fault tolerance.")
    print()
    print(Fore.CYAN + "─" * 70 + Style.RESET_ALL)
    print(Fore.CYAN + "  PDC CONCEPTS DEMONSTRATED" + Style.RESET_ALL)
    print(Fore.CYAN + "─" * 70 + Style.RESET_ALL)
    print("  • Embarrassingly parallel workloads")
    print("  • Strong scaling, speedup & parallel efficiency")
    print("  • Amdahl's Law: serial fraction measurement")
    print("  • Epidemic/gossip protocols")
    print("  • Message overhead trade-offs")
    print("  • Load balancing across workers")
    print()
    print(Fore.CYAN + "─" * 70 + Style.RESET_ALL)
    print(Fore.CYAN + "  KEY METRICS" + Style.RESET_ALL)
    print(Fore.CYAN + "─" * 70 + Style.RESET_ALL)
    print("  • P50/P95/P99 latency — delivery speed distribution")
    print("  • Throughput — deliveries per second")
    print("  • Speedup — how much faster than sequential")
    print("  • Parallel efficiency — speedup ÷ ideal speedup")
    print("  • Message overhead — redundant messages sent")
    print()
    press_enter()


def menu_main():
    """Top-level main menu."""
    while True:
        opts = [
            {"label": "▶  Run Simulation (default settings)"},
            {"label": "⚙  Configure & Run"},
            {"label": "📊  Scaling Analysis (sweep user counts)"},
            {"label": "🖼  View Generated Plots"},
            {"label": "📖  About the Strategies"},
            {"label": "🚪  Exit"},
        ]
        m = Menu(
            "NOTIFICATION FANOUT SIMULATION  —  Parallel & Distributed Computing Demo",
            opts,
            allow_multi=False,
        )
        sel = m.run()
        if not sel:
            show_cursor()
            print(Fore.GREEN + "\nGoodbye!" + Style.RESET_ALL + "\n")
            return

        label = sel[0]["label"]

        if "Run Simulation" in label and "default" in label:
            config.clear()
            config.update(DEFAULTS)
            run_simulation_once()
            press_enter()

        elif "Configure" in label:
            menu_configure()

        elif "Scaling" in label:
            run_scaling_analysis()
            press_enter()

        elif "View" in label and "Plots" in label:
            view_plots()

        elif "About" in label:
            menu_about()

        elif "Exit" in label:
            show_cursor()
            print(Fore.GREEN + "\nGoodbye!" + Style.RESET_ALL + "\n")
            return


def view_plots():
    """List and offer to open generated plot files."""
    show_cursor()
    results_dir = os.path.join(os.path.dirname(__file__), "results")
    if not os.path.isdir(results_dir):
        print(Fore.YELLOW + "\nNo plots directory found. Run a simulation first." + Style.RESET_ALL)
        press_enter()
        return

    pngs = sorted(f for f in os.listdir(results_dir) if f.endswith(".png"))
    if not pngs:
        print(Fore.YELLOW + "\nNo plots generated yet. Run a simulation first." + Style.RESET_ALL)
        press_enter()
        return

    clear_screen()
    print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
    print(Fore.CYAN + "  GENERATED PLOTS" + Style.RESET_ALL)
    print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
    print()
    for i, fname in enumerate(pngs, 1):
        path = os.path.join(results_dir, fname)
        size = os.path.getsize(path)
        label_map = {
            "01_latency_cdf.png": "Latency CDF by Strategy",
            "02_speedup.png": "Speedup vs Sequential",
            "03_throughput.png": "Delivery Throughput",
            "04_message_overhead.png": "Message Overhead Analysis",
            "05_efficiency.png": "Parallel Efficiency",
            "06_scaling.png": "Scaling with User Count",
            "07_gossip_coverage.png": "Gossip Delivery Coverage",
        }
        desc = label_map.get(fname, fname)
        print(f"  {i}. {Fore.YELLOW}{desc}{Style.RESET_ALL}  ({size // 1000} KB)")
    print()
    print(Fore.YELLOW + "  Plots saved to: " + results_dir + Style.RESET_ALL)
    print()

    # Try to open first plot
    import subprocess, webbrowser
    first = pngs[0]
    path = os.path.join(results_dir, first)
    try:
        os.startfile(path)
        print(Fore.GREEN + "  Opened in default image viewer." + Style.RESET_ALL)
    except Exception:
        try:
            webbrowser.open(path)
        except Exception:
            pass

    press_enter()


def main():
    try:
        menu_main()
    except KeyboardInterrupt:
        show_cursor()
        print(Fore.YELLOW + "\nInterrupted" + Style.RESET_ALL)
        sys.exit(0)


if __name__ == "__main__":
    main()
