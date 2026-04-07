# Cocapn Fleet Identity
You run agents, but they need a shared context. This Cloudflare Worker maintains a single source of truth for your autonomous agent fleet's state and collective intent. It's a fork-first, minimal coordination layer. ⚙️

Open source under the MIT license. Zero runtime dependencies. Deploys entirely on Cloudflare Workers.

**Live Instance:** https://fleet-identity.casey-digennaro.workers.dev

---

## Purpose
When agents operate independently, they can lose track of the group's overarching goal. This worker provides a central place for them to report status and read a synthesized, plain-language statement of what the fleet is currently doing. It resolves simple priority conflicts based on logic you define.

---

## What It Does
When an agent checks in via HTTP POST, this worker:
*   Updates the stored fleet state (health, tasks, vessel count).
*   Runs your configured logic to reconcile any conflicting priorities.
*   Generates and stores a one-sentence summary of the fleet's current primary objective.
*   Provides a JSON snapshot endpoint (`/snapshot`) for any agent or dashboard to read.
*   Serves a simple, real-time dashboard for human monitoring.

It does not schedule tasks or send commands to agents. Agents choose when to report in and when to read the shared state.

---

## Quick Start
1.  **Fork this repository.** This is designed to be your own codebase, not an imported library.
2.  **Deploy to Cloudflare Workers.** You need a Workers subscription and one KV namespace named `FLEET_KV`.
3.  **Modify the logic.** Edit the conflict resolution and intent generation prompts directly in `src/index.ts`. This is your primary configuration.

---

## Architecture
Fleet state is persisted in a Cloudflare KV store. On each agent check-in request, the worker:
1.  Reads the current state from KV.
2.  Merges the new agent's report.
3.  (Optionally) Can call an LLM (default: DeepSeek) to mediate conflicts and generate the intent statement. You can replace this with custom logic.
4.  Writes the updated state back to KV.
5.  Returns the new state to the agent.

Nothing runs on a loop. Operations are triggered by HTTP requests. Cold starts are typically under 100ms.

---

## Features
*   **Persistent State:** Tracks fleet health, active tasks, and a cohesion score in KV.
*   **Conflict Resolution:** Basic logic to adjudicate between reported agent priorities.
*   **Collective Intent:** Outputs a clear, one-sentence goal statement for the fleet.
*   **Live API:** GET `/snapshot` returns the current state as JSON.
*   **Dashboard:** A minimal HTML page to view the fleet status in real-time.
*   **Self-Contained:** No external dependencies at runtime.
*   **Fork-First Design:** You own and modify the entire codebase.

## Limitation
The system processes check-ins sequentially. If two agents report simultaneously, the latter request will overwrite the state updates of the former, as there is no transactional locking. This is typically fine for small fleets (e.g., under 10 agents checking in less than once per second).

---

## License
MIT. Use your copy as you see fit.

Attribution: Superinstance and Lucineer (DiGennaro et al.)

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>