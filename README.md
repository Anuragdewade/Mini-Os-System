# Mini OS Simulator

An interactive, visual laboratory and simulation suite designed to make abstract Operating System concepts intuitive and concrete. Explore process lifecycles, CPU scheduling algorithms, deadlock safety analysis, and file system block I/O operations through interactive web modules and terminal tools.

---

## Web Modules

The web application provides a visual interface for four core operating system domains:

| # | Module | Key Features |
|---|--------|--------------|
| **1** | **Process & Thread Simulator** | PCB/TCB lifecycle management, state transitions (`NEW` → `READY` → `RUNNING` → `WAITING` / `TERMINATED`), process budgeting, and live event logging. |
| **2** | **CPU Scheduling Laboratory** | FCFS, SJF, Round Robin, Priority, and Multi-Level Feedback Queue (MLFQ). Features interactive Gantt charts, metrics calculation (wait, turnaround, response times), and comparative analysis. |
| **3** | **Deadlock Analyzer** | Interactive Resource Allocation Graph (RAG) with cycle detection, alongside Banker's Algorithm with safe sequence calculation and matrix walkthroughs. |
| **4** | **Mini File System & Block I/O** | FAT-like virtual disk with an interactive shell (`ls`, `mkdir`, `cd`, `create`, `write`, `cat`, `rm`, `rename`), directory tree explorer, and a Block I/O Cost Analyzer comparing Contiguous, Linked, and Indexed allocation. |

---

## Screenshots

| Feature | Screenshot | Description |
|---------|------------|-------------|
| **CPU Scheduling** | ![CPU Scheduling](img/cpu%20scheduling.png) | Compare workloads across FCFS, SJF, RR, Priority, and MLFQ with real-time Gantt charts and metric cards. |
| **Deadlock — RAG** | ![Deadlock Analyzer 1](img/Deadlock%20Analyzer1.png) | Resource Allocation Graph: processes, resources, request/assignment edges, and automatic cycle detection. |
| **Deadlock — Banker's** | ![Deadlock Analyzer 2](img/Deadlock%20Analyzer2.png) | Banker's Algorithm: Allocation, Max, Available matrices, and step-by-step safe sequence verification. |
| **Mini File System** | ![Mini File System](img/Mini%20File%20System.png) | In-browser virtual disk shell and visual directory tree for file manipulation. |
| **Block I/O Analyzer** | ![Block I/O Analyzer](img/block%20analyzer.png) | Simulate file insertion/removal at begin/middle/end across Contiguous, Linked, and Indexed strategies. |
| **Block I/O Comparison** | ![Block I/O Analyzer 2](img/block%20analyzer2.png) | Side-by-side read/write cost breakdown and visual comparative charts. |

---

## Tech Stack

### Web Application (`web/`)
- **Framework**: Next.js 16 (App Router, Static Export)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4) with custom dark mode and system theme detection
- **Charts & Visualization**: Recharts, Lucide Icons

### Terminal Simulator (`src/` & `include/`)
- **Language**: C++17 (standard library only)
- **Build System**: CMake 3.16+

---

## Getting Started

### 1. Web Version (Next.js)

```bash
# Navigate to the web application directory
cd web

# Install dependencies
npm install

# Start the local development server (http://localhost:3000)
npm run dev

# Create an optimized production static build
npm run build
```

The production output is generated in `web/out/` and is ready for static deployment on Vercel, GitHub Pages, or Netlify.

### 2. Terminal Version (C++17)

```bash
# From repository root
mkdir build && cd build

# Configure and compile
cmake ..
make -j$(nproc)   # Linux  |  make -j$(sysctl -n hw.ncpu)  # macOS

# Run the terminal simulator
./mini_os_sim
```

---

## Project Structure

```
Mini-Os-System/
├── CMakeLists.txt          # Root C++ CMake configuration
├── README.md               # Project documentation
├── LEARNING.md             # Educational notes and OS theory
├── img/                    # Interface screenshots
├── include/                # C++ header files
├── src/                    # C++ simulator implementations
└── web/                    # Next.js web application
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # Lab overview & module hub
    │   │   ├── process/          # Module 1: Process & Thread
    │   │   ├── scheduler/        # Module 2: CPU Scheduling
    │   │   ├── deadlock/         # Module 3: Deadlock Analyzer
    │   │   └── filesystem/       # Module 4: Mini File System & Block I/O
    │   ├── components/           # Reusable UI & layout components
    │   └── lib/                  # Simulation algorithms & data structures
    └── package.json
```

---

## Deployment on Vercel

To deploy this project on [Vercel](https://vercel.com):

1. Import your repository into Vercel.
2. In the **Configure Project** settings, click **Edit** next to **Root Directory** and select **`web`**.
3. Vercel will automatically detect **Next.js** as the framework preset.
4. Click **Deploy**.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
