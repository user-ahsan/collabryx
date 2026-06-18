# Notification Fanout — Parallel & Distributed Computing Demo

## 🤔 What Is This Project?

This is a **parallel & distributed computing simulation** that models how a notification system delivers messages to thousands of users at once. Instead of sending one notification at a time (slow), modern systems use different **parallel strategies** to deliver to everyone as fast as possible. This project lets you compare those strategies side-by-side, see how they scale, and understand the trade-offs each one makes.

## 📨 What Is "Fanout"?

In distributed systems, **fanout** (or notification fanout) is the process of taking **one** event — like a new post, a like, or a comment — and delivering a notification about it to **many** users at once.

Think of it like a real fan:
- **Input:** One notification event (e.g. "Alice posted a message")
- **Output:** The same notification delivered to hundreds or thousands of followers
- **The challenge:** How do you deliver to everyone as fast as possible without overwhelming your system?

Real-world examples of fanout:
- **Twitter/X:** A tweet from a celebrity with 10M followers needs to reach all of them
- **YouTube:** A new video upload notifies millions of subscribers
- **Instagram:** A post from a popular account fans out to all followers' feeds
- **Messaging apps:** A group message goes to every member in real-time

This simulation compares **4 different fanout strategies** — from simple sequential delivery to epidemic gossip protocols — and shows how each one performs, scales, and handles load.

---

## 🚀 Quick Start

### 🎮 Interactive Menu (Recommended)

```powershell
cd pdc/notification_fanout

# Launch interactive menu
python main.py
```

Arrow keys to navigate, ENTER to select, Q/Esc to quit.

**Menu options:**
| Option | What it does |
|--------|-------------|
| **▶ Run (default)** | Quick run — 50 notifications, 100 users, all 4 strategies |
| **⚙ Configure & Run** | Full customization — counts, strategies, seed, plots |
| **📊 Scaling Analysis** | Sweeps user counts [10 → 500] to measure scaling behaviour |
| **🖼 View Plots** | Opens generated PNG plots from `results/` |
| **📖 About** | Strategy reference and PDC concept explanations |

### ⚙ CLI Fallback

For automation, batch runs, or scripting:

```powershell
# Run default simulation (50 notifs, 100 users, all strategies)
python run.py

# Custom parameters
python run.py --notifications 100 --users 500

# Scaling analysis (sweeps user counts: 10 → 25 → 50 → 100 → 200 → 500)
python run.py --scale

# Gossip deep dive
python run.py --gossip-only --users 1000

# No plots (CLI only)
python run.py --no-plots
```

---

## 🧠 Four Strategies

| Strategy | How It Works | PDC Insight |
|----------|-------------|-------------|
| **SEQUENTIAL** | One user at a time | Baseline — measures the serial fraction (Amdahl's Law) |
| **THREAD_POOL** | Concurrent via `ThreadPoolExecutor` | I/O-bound parallelism; GIL doesn't block I/O |
| **PROCESS_POOL** | Concurrent via `ProcessPoolExecutor` | True CPU parallelism; IPC overhead cost |
| **GOSSIP** | Epidemic broadcast — each node tells 3 peers | Eventual consistency; redundancy trades speed for reliability |

---

## 🏗️ Project Structure

```
notification_fanout/
├── main.py               🎮 Interactive terminal menu (arrow-key driven)
├── run.py                ⚙ CLI entry point (all flags supported)
├── simulation.py         🧠 Core engine — 4 strategies + delivery simulation + reporting
├── plots.py              📈 7 publication-quality plots (Matplotlib)
├── results/              🖼 Generated PNG plots
│   ├── 01_latency_cdf.png
│   ├── 02_speedup.png
│   ├── 03_throughput.png
│   ├── 04_message_overhead.png
│   ├── 05_efficiency.png
│   ├── 06_scaling.png
│   └── 07_gossip_coverage.png
├── requirements.txt      Dependencies
└── README.md             This file
```

---

## 📊 Generated Plots

| File | What It Shows |
|------|---------------|
| `01_latency_cdf.png` | Cumulative distribution of per-delivery latency — P50/P95/P99 markers |
| `02_speedup.png` | Total time + speedup vs sequential (bar chart) |
| `03_throughput.png` | Deliveries per second per strategy |
| `04_message_overhead.png` | Total messages sent + overhead % vs sequential |
| `05_efficiency.png` | Parallel efficiency (speedup ÷ ideal × 100) |
| `06_scaling.png` | Delivery time vs user count — how each strategy scales |
| `07_gossip_coverage.png` | Users reached per notification under gossip |

---

## 📈 PDC Concepts Demonstrated

| Concept | Where |
|---------|-------|
| **Embarrassingly parallel** | Thread pool & process pool deliver to all recipients simultaneously |
| **Amdahl's Law / Strong scaling** | Speedup measured relative to sequential baseline |
| **Parallel efficiency** | Speedup ÷ ideal speedup × 100 (measured in plots) |
| **Gossip / epidemic protocol** | Peer-to-peer propagation (DynamoDB, Cassandra, Bitcoin) |
| **Message overhead trade-off** | Gossip sends more total messages than direct delivery |
| **Load balancing** | Worker pools distribute delivery across available cores |
| **IPC overhead** | Process pool vs thread pool comparison shows cross-process cost |

---

## 📈 Expected Results

```
                          Time(s)   Throughput/s   P50(ms)   P95(ms)   P99(ms)   Speedup   Msg/Notif
SEQUENTIAL                 ~5.0s         ~1000         ~8       ~40       ~48       1.00x       100
THREAD_POOL                ~0.1s       ~50000         ~8       ~40       ~48      50.0x       100
PROCESS_POOL               ~0.1s       ~50000         ~8       ~40       ~48      50.0x       100
GOSSIP                     ~0.3s       ~17000         ~8       ~40       ~48      16.0x        ~310
```

- **Thread pool ≈ Process pool** for I/O-bound work (sleep = I/O wait)
- **Gossip is slower** but reaches all users with fewer direct connections
- **Gossip sends ~3× more messages** but provides redundancy and fault tolerance
- **Efficiency drops** as cores increase (Amdahl's Law — serial fraction limits speedup)
