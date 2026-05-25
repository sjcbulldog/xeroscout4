# XeroScout 4 — Design Document

**Version:** 4.0.0 (draft)  
**Author:** Jack (Butch) Griffin  
**Date:** 2026-05-24

---

## 1. Overview

XeroScout 4 is the next-generation FRC (FIRST Robotics Competition) scouting system. It evolves XeroScout 3's single-executable design into **three independent, purpose-built applications** sharing a common NestJS server core and a TypeScript codebase throughout.

| Application | Technology | Role |
|---|---|---|
| **Scouting Tablet** | React Native (TypeScript) | Data collection on Windows/iOS/Android tablets |
| **Central** | Electron (TypeScript) | Event management and analysis on a Windows PC |
| **XeroScout Server** | NestJS (TypeScript) + MySQL | REST API server — runs both in the cloud and locally on Central |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUD  (Linux VPS)                                                 │
│  XeroScout Server (NestJS)  ←→  MySQL Database                      │
│  • REST API endpoints                                               │
│  • Manages events, teams, matches, scouting data, corrections       │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTPS REST (bidirectional sync)
                             │  Central always wins on conflict
┌────────────────────────────▼────────────────────────────────────────┐
│  CENTRAL  (Windows PC)                                              │
│  Electron App  ←IPC→  XeroScout Server (NestJS, child process)      │
│                        └─→  MySQL Database (local)                  │
│  • Event creation / management                                      │
│  • Full analysis suite (formulas, pick lists, graphs, playoffs)     │
│  • Form editor (WYSIWYG)                                            │
│  • Coach mode (separate personality in same exe)                    │
│  • Bidirectional sync with cloud                                    │
└─────┬──────────────────────────────────────────────────────────────-┘
      │  HTTPS REST  (direct to cloud OR local NestJS server)
      │  Tablet chooses endpoint; fully offline-capable
┌─────▼──────────────────────────────────────────────────────────────-┐
│  SCOUTING TABLET  ×6  (iPad / Android tablet / Windows tablet)      │
│  React Native App                                                   │
│  • Downloads form + assignment list from server                     │
│  • Scouts matches and team pits offline                             │
│  • Queues results locally (expo-sqlite / AsyncStorage)              │
│  • Uploads queued results one-by-one when connected                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Component | Technology |
|---|---|
| Scouting Tablet | React Native 0.74+, TypeScript, Expo SDK, expo-sqlite |
| Central shell | Electron 36+, TypeScript |
| Central renderer | TypeScript, webpack, Tabulator 6, Chart.js 4 |
| Central/Cloud server | NestJS (TypeScript), TypeORM |
| Cloud database | MySQL 8.x |
| Central database | MySQL 8.x (full server installed on Central PC) |
| Logging | Winston (server & Electron main), React Native console → remote log |
| Auth | Per-team API keys (Bearer token in Authorization header) |
| External data | Blue Alliance API, Statbotics API |
| Build/package | Electron Forge (Central), Expo EAS (Tablet), npm workspaces (monorepo) |
| Package manager | npm throughout |

---

## 4. Repository Structure

```
xeroscout4/                        ← monorepo root
├── package.json                   ← workspace root (npm workspaces)
├── tsconfig.base.json             ← shared TypeScript base config
├── shared/                        ← shared TypeScript types (forms, IPC, API contracts)
│   └── src/
│       ├── formtypes.ts           ← IPCForm, IPCSection, IPCFormItem, control types
│       ├── apitypes.ts            ← REST request/response types
│       ├── datatypes.ts           ← ScoutingResult, Correction, Team, Match, etc.
│       └── datavalue.ts           ← DataValue union type (carried over from v3)
│
├── server/                        ← NestJS application (cloud + Central)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/                  ← API key guard
│   │   ├── events/                ← event CRUD
│   │   ├── teams/                 ← team roster
│   │   ├── matches/               ← match schedule
│   │   ├── forms/                 ← form storage and retrieval
│   │   ├── tablets/               ← tablet registration and assignment
│   │   ├── scouting/              ← scouting result ingestion and retrieval
│   │   ├── corrections/           ← data correction management
│   │   ├── sync/                  ← Central ↔ Cloud bidirectional sync endpoints
│   │   ├── analysis/              ← formulas, datasets, graphs, picklists
│   │   ├── extnet/                ← Blue Alliance + Statbotics clients
│   │   └── entities/              ← TypeORM entity definitions
│   └── package.json
│
├── central/                       ← Electron application
│   ├── main/
│   │   └── src/
│   │       ├── main.ts            ← Electron entry + server child process launcher
│   │       ├── apps/
│   │       │   ├── scbase.ts
│   │       │   ├── sccentral.ts
│   │       │   └── sccoach.ts
│   │       ├── ipchandlers.ts
│   │       ├── preload.ts
│   │       └── servermgr.ts       ← spawns/kills the NestJS server process
│   ├── renderer/
│   │   └── src/
│   │       ├── apps/xeroapp.ts
│   │       ├── views/             ← all UI views (same structure as v3)
│   │       └── widgets/
│   └── package.json
│
└── tablet/                        ← React Native application
    ├── src/
    │   ├── app/                   ← navigation + app shell
    │   ├── screens/
    │   │   ├── SelectTabletScreen.tsx
    │   │   ├── SyncScreen.tsx
    │   │   ├── MatchListScreen.tsx
    │   │   ├── TeamListScreen.tsx
    │   │   ├── ScoutFormScreen.tsx
    │   │   └── PlayoffScreen.tsx
    │   ├── components/
    │   │   └── formcontrols/      ← one component per v3 control type
    │   ├── storage/
    │   │   ├── localdb.ts         ← expo-sqlite wrapper
    │   │   └── queue.ts           ← offline sync queue
    │   └── api/
    │       └── client.ts          ← REST API client (points to cloud or local)
    └── package.json
```

---

## 5. Database Schema (MySQL)

All events share a single MySQL database (`xeroscout`). Each table has an `event_id` foreign key where applicable.

### 5.1 Core Tables

#### `api_keys`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `team_number` | INT | FRC team number |
| `key_hash` | VARCHAR(64) | SHA-256 of the API key |
| `label` | VARCHAR(255) | Human-readable label |
| `created_at` | DATETIME | |
| `last_used_at` | DATETIME | |

#### `events`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `uuid` | VARCHAR(36) UNIQUE | UUID, used for sync identity |
| `name` | VARCHAR(255) | |
| `ba_event_key` | VARCHAR(64) | Blue Alliance event key |
| `year` | INT | |
| `locked` | BOOLEAN | Frozen for scouting |
| `team_form_json` | LONGTEXT | Team scouting form (JSON) |
| `match_form_json` | LONGTEXT | Match scouting form (JSON) |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | Timestamp used for sync conflict detection |

#### `teams`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `team_number` | INT | |
| `nickname` | VARCHAR(255) | |
| `opr` | FLOAT | From Blue Alliance |
| `dpr` | FLOAT | |
| `ccwm` | FLOAT | |
| `rank` | INT | |
| `epa` | FLOAT | From Statbotics |
| `updated_at` | DATETIME | |

#### `matches`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `comp_level` | ENUM('qm','sf','f') | |
| `match_number` | INT | |
| `set_number` | INT | |
| `red1` | INT | Team number |
| `red2` | INT | |
| `red3` | INT | |
| `blue1` | INT | |
| `blue2` | INT | |
| `blue3` | INT | |
| `red_score` | INT | NULL until played |
| `blue_score` | INT | |
| `updated_at` | DATETIME | |

#### `tablets`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `name` | VARCHAR(255) | Tablet display name |
| `purpose` | ENUM('match','team') | |

#### `tablet_assignments`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `tablet_id` | INT FK | |
| `event_id` | INT FK | |
| `match_id` | INT FK NULL | For match tablets |
| `team_number` | INT NULL | For team (pit) tablets |
| `alliance_position` | TINYINT NULL | 1-6 (position in match) |

### 5.2 Scouting Data Tables

#### `scouting_results`
Stores raw data submitted by a scouting tablet. One row per (event, match, team, tablet, submission).

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `tablet_id` | INT FK | |
| `match_id` | INT FK NULL | NULL for team scouting |
| `team_number` | INT | |
| `result_type` | ENUM('match','team') | |
| `data_json` | LONGTEXT | JSON object: `{ fieldName: value, … }` |
| `scouted_at` | DATETIME | Timestamp from the tablet |
| `uploaded_at` | DATETIME | Server receipt time |
| `source` | ENUM('tablet','central') | Who submitted this result |

#### `corrections`
Stores corrections made by the scouting lead on Central. Always takes priority over `scouting_results` for analysis queries.

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `match_id` | INT FK NULL | NULL for team corrections |
| `team_number` | INT | |
| `result_type` | ENUM('match','team') | |
| `field_name` | VARCHAR(255) | The specific field being corrected |
| `corrected_value` | TEXT | JSON-encoded DataValue |
| `original_value` | TEXT | JSON-encoded original for audit |
| `corrected_by` | VARCHAR(255) | Operator name/label |
| `corrected_at` | DATETIME | |

### 5.3 Analysis Tables

#### `formulas`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `name` | VARCHAR(255) | |
| `expression` | TEXT | |
| `scope` | ENUM('team','match') | |
| `owner` | ENUM('central','coach') | |

#### `datasets`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `name` | VARCHAR(255) | |
| `filter_type` | ENUM('all','first_n','last_n','range','specific') | |
| `filter_params` | TEXT | JSON |

#### `graphs`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `name` | VARCHAR(255) | |
| `config_json` | TEXT | IPCGraphConfig serialized |
| `owner` | ENUM('central','coach') | |

#### `picklists`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK | |
| `name` | VARCHAR(255) | |
| `config_json` | TEXT | IPCPickListConfig serialized |
| `owner` | ENUM('central','coach') | |

#### `playoff_bracket`
| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `event_id` | INT FK UNIQUE | One bracket per event |
| `bracket_json` | LONGTEXT | IPCPlayoffStatus serialized |
| `updated_at` | DATETIME | |

### 5.4 Sync Tracking Table

#### `sync_log`
Used for bidirectional Central ↔ Cloud sync conflict detection. Every row mutation is tracked.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `table_name` | VARCHAR(64) | Table that changed |
| `row_id` | INT | PK of the changed row |
| `operation` | ENUM('insert','update','delete') | |
| `changed_at` | DATETIME(3) | Millisecond precision |
| `source` | ENUM('central','cloud') | Where the change originated |
| `synced` | BOOLEAN DEFAULT FALSE | Has this been pushed to the other side |

---

## 6. NestJS Server — REST API

All endpoints require `Authorization: Bearer <api-key>` except the health check.

### 6.1 Base URL

- Cloud: `https://<vps-hostname>/api/v1`
- Central (local): `http://localhost:4560/api/v1`

### 6.2 Endpoint Groups

#### Auth & Keys
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (no auth) |
| POST | `/auth/validate` | Validate an API key |

#### Events
| Method | Path | Description |
|---|---|---|
| GET | `/events` | List all events for this API key's team |
| POST | `/events` | Create a new event |
| GET | `/events/:uuid` | Get event details |
| PUT | `/events/:uuid` | Update event (name, lock status, forms) |

#### Teams & Matches
| Method | Path | Description |
|---|---|---|
| GET | `/events/:uuid/teams` | List teams |
| PUT | `/events/:uuid/teams` | Bulk upsert team list |
| GET | `/events/:uuid/matches` | List match schedule |
| PUT | `/events/:uuid/matches` | Bulk upsert match schedule |

#### Tablets
| Method | Path | Description |
|---|---|---|
| GET | `/events/:uuid/tablets` | List tablets + assignments |
| PUT | `/events/:uuid/tablets` | Upsert tablet list + assignments |

#### Scouting Results
| Method | Path | Description |
|---|---|---|
| POST | `/events/:uuid/results` | Submit a single scouting result |
| GET | `/events/:uuid/results` | Retrieve all results (with corrections applied) |
| GET | `/events/:uuid/results/raw` | Retrieve raw results without corrections |

#### Corrections
| Method | Path | Description |
|---|---|---|
| POST | `/events/:uuid/corrections` | Submit a field-level correction |
| GET | `/events/:uuid/corrections` | List all corrections |
| DELETE | `/events/:uuid/corrections/:id` | Remove a correction |

#### Analysis
| Method | Path | Description |
|---|---|---|
| GET/PUT | `/events/:uuid/formulas` | Formulas CRUD |
| GET/PUT | `/events/:uuid/datasets` | Datasets CRUD |
| GET/PUT | `/events/:uuid/graphs` | Graphs CRUD |
| GET/PUT | `/events/:uuid/picklists` | Picklists CRUD |
| GET/PUT | `/events/:uuid/playoff` | Playoff bracket |

#### Central ↔ Cloud Sync
| Method | Path | Description |
|---|---|---|
| GET | `/sync/delta?since=<ISO8601>` | Get all changes since timestamp |
| POST | `/sync/push` | Push a batch of local changes |
| POST | `/sync/resolve-conflict` | Report a conflict resolution (Central wins) |

#### Tablet Bootstrap
| Method | Path | Description |
|---|---|---|
| GET | `/events/:uuid/tablet-init/:tabletName` | Download form + assignment list for a specific tablet |
| GET | `/events/:uuid/images` | List available field images |
| GET | `/events/:uuid/images/:name` | Download a specific image (base64) |

---

## 7. Scouting Form System

### 7.1 Form Compatibility

XeroScout 4 forms use the **identical JSON schema** as v3 (`IPCForm`). V3 form files can be loaded directly with no migration.

```typescript
IPCForm {
  purpose: "team" | "match"
  tablet: { name: string, size: { width: number, height: number } }
  sections: IPCSection[]
}

IPCSection {
  name: string
  items: IPCFormItem[]
}

IPCFormItem {
  type: "label" | "text" | "textarea" | "boolean" | "updown" | "choice" |
        "select" | "timer" | "stopwatch" | "box" | "image" |
        "autoplan" | "autoselector"
  tag: string           // field name / data key
  x, y, width, height: number   // absolute pixel coordinates
  // … all other v3 properties preserved
}
```

Forms are stored as `LONGTEXT` JSON in the `events` table (`team_form_json`, `match_form_json`).

### 7.2 Form Rendering on Tablet (React Native)

The React Native form renderer maps each `IPCFormItem.type` to a React component:

| Control Type | React Native Component |
|---|---|
| `label` | `<Text>` with styling |
| `text` | `<TextInput>` |
| `textarea` | `<TextInput multiline>` |
| `boolean` | `<Switch>` or toggle button |
| `updown` | Custom `UpDownControl` with +/− buttons |
| `choice` | Row/column of `<TouchableOpacity>` buttons |
| `select` | `<Picker>` / modal picker |
| `timer` | Countdown timer with `useRef` interval |
| `stopwatch` | Elapsed time with start/stop |
| `box` | `<View>` with border styling |
| `image` | `<Image>` (field map) |
| `autoplan` | Canvas/SVG autonomous path widget |
| `autoselector` | Field-image overlay selector |

The form is rendered in a `<ScrollView>` with absolute positioning matching the v3 pixel coordinates, scaled to the device viewport.

### 7.3 Form Editor (Central only)

The WYSIWYG form editor is carried over from v3 with the same capabilities: drag-to-place, resize handles, property panel, undo/redo stack, multi-select, keyboard shortcuts.

---

## 8. Central Application

### 8.1 Application Personalities

The Central Electron app supports two personalities selected at launch:

| Personality | CLI arg | Role |
|---|---|---|
| **Central** | `central` (default) | Full event management + analysis |
| **Coach** | `coach` | Read-only analysis, owns coach pick lists/graphs |

### 8.2 Server Management

`ServerManager` (`central/main/src/servermgr.ts`) is responsible for:

1. Locating the bundled NestJS server binary (packaged with `electron-forge`).
2. Launching the server as a child process on startup: `node server.js --port 4560`.
3. Waiting for the server to be ready (polling `GET /health`).
4. Forwarding server log output to Winston.
5. Gracefully terminating the server on app exit.

### 8.3 Event Creation Flow (mirrors v3)

1. **File → Create Event** → choose directory → event created in MySQL + `event.json` mirror for UI state.
2. **Event Info view** shows key properties.
3. **Data → Import from Blue Alliance** → load teams, match schedule, OPR, rankings.
4. **Data → Import from Statbotics** → load EPA per team.
5. **File → Create/Select Team Form** and **Match Form** via form editor or file picker.
6. **Assign Tablets** → add tablets, drag to Match/Team columns.
7. **File → Lock Event** → freezes form and assignments; auto-assigns each tablet to matches/teams.
8. Scouts sync their tablets (connecting to local NestJS or cloud).

### 8.4 Navigation Structure (Central personality)

| Section | Items |
|---|---|
| General | Help, About |
| Event Setup | Event Info, Assign Tablets, Datasets, Cloud Sync |
| Teams | Team Form, Team Status, Team Data |
| Match | Match Form, Match Status, Match Data |
| — | Playoffs |
| Analysis | Formulas, Pick List, Single Team View |

### 8.5 Data Correction Workflow

1. Open **Match Data** or **Team Data** view.
2. Click a cell to edit it.
3. On save, the Electron app calls `POST /events/:uuid/corrections` with the field name, corrected value, and operator identity.
4. The corrections table row takes priority whenever results are queried for analysis.
5. The corrections panel shows a diff: original scouted value vs. corrected value, with the correcting operator's name and timestamp.

### 8.6 Cloud Sync (Central)

Central's **Cloud Sync** view:

1. Connects to the cloud NestJS server using the team's API key.
2. Calls `GET /sync/delta?since=<last-sync-time>` to fetch new cloud changes.
3. Calls `POST /sync/push` to send local changes not yet on the cloud.
4. On conflict (same row changed on both sides since last sync), **Central's version wins**; a conflict report is sent via `POST /sync/resolve-conflict`.
5. Last sync timestamp is persisted in `event.json` / local settings.

---

## 9. Scouting Tablet Application

### 9.1 Core Flow

1. **Server Configuration screen** — enter cloud server URL or local server IP; API key is entered once and stored in secure storage (`expo-secure-store`).
2. **Sync/Select Tablet screen** — download list of available tablets from server; select this device's identity; download form + assignment list.
3. **Match List / Team List screen** — shows assigned matches or teams; offline-available after initial sync.
4. **Scout Form screen** — renders the scouting form for the selected match/team.
5. **Submit** — result is saved to local expo-sqlite queue.
6. **Upload Queue screen** — shows pending uploads; tapping "Sync" uploads queued results one at a time to the configured server.

### 9.2 Offline Queue (expo-sqlite)

```sql
-- Local tablet database
CREATE TABLE queued_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_uuid  TEXT NOT NULL,
  result_type TEXT NOT NULL,  -- 'match' | 'team'
  match_id    INTEGER,
  team_number INTEGER NOT NULL,
  data_json   TEXT NOT NULL,
  scouted_at  TEXT NOT NULL,
  uploaded    INTEGER DEFAULT 0  -- 0=pending, 1=uploaded
);

CREATE TABLE local_assignments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_uuid      TEXT NOT NULL,
  result_type     TEXT NOT NULL,
  match_id        INTEGER,
  team_number     INTEGER NOT NULL,
  alliance_pos    INTEGER,
  completed       INTEGER DEFAULT 0
);

CREATE TABLE local_config (
  key   TEXT PRIMARY KEY,
  value TEXT
);
```

### 9.3 Sync Strategy

- **Download** (at sync time): full assignment list + form JSON for this tablet's identity.
- **Upload**: iterate `queued_results WHERE uploaded = 0`; POST each to `/events/:uuid/results`; mark `uploaded = 1` on success; retry on failure (exponential backoff).
- Tablets can connect to either the **local Central NestJS server** (faster, on-site LAN) or the **cloud server** (over internet). The URL is configurable per device.

---

## 10. Bidirectional Sync Protocol (Central ↔ Cloud)

### 10.1 Change Tracking

Every INSERT/UPDATE/DELETE on the MySQL server (both Central and Cloud) appends a row to `sync_log` via database triggers or TypeORM lifecycle hooks.

### 10.2 Sync Sequence (Central initiates)

```
Central                         Cloud Server
  ─── GET /sync/delta ─────────►   (since last_sync_at)
  ◄── { changes: [...] } ──────
  ─── POST /sync/push ─────────►   (local changes since last_sync_at)
  ◄── { conflicts: [...] } ────
  ─── POST /sync/resolve ──────►   (Central's versions for any conflicts)
  ◄── { ok } ─────────────────
  (update last_sync_at = now)
```

### 10.3 Conflict Resolution

- A conflict occurs when the same row (`table_name` + `row_id`) has changes on both sides since `last_sync_at`.
- **Central always wins**: Central's version is pushed to the cloud via `resolve-conflict`.
- Corrections are append-only (never conflict) — both sides' corrections are merged.

---

## 11. Authentication

### 11.1 API Keys

- One API key per FRC team (valid across all events for that team).
- The key is a 32-byte random hex string: `xs4_<64-hex-chars>`.
- Stored as SHA-256 hash in `api_keys` table; the plain key is shown once at creation.
- All requests include: `Authorization: Bearer xs4_<key>`.
- The NestJS `ApiKeyGuard` looks up the hash, validates, and injects the `team_number` into the request context.

### 11.2 Admin Setup

Cloud server admin creates a team API key via a CLI management script:

```bash
node manage.js create-key --team 1234 --label "Team 1234 main key"
# Output: xs4_<64-hex-chars>  (shown once)
```

---

## 12. External Integrations

### 12.1 Blue Alliance

The NestJS server provides a `/extnet/ba/*` proxy, or the Central Electron app can call TBA directly. Fetches:
- Event list by year
- Team roster for an event
- Match schedule
- OPR / DPR / CCWM
- Team rankings

### 12.2 Statbotics

The NestJS server provides a `/extnet/statbotics/*` proxy. Fetches:
- EPA per team

---

## 13. Analysis System (Central)

All analysis data is served from the NestJS server's analysis endpoints. The Central renderer calls these via IPC → Electron main → local NestJS HTTP.

### 13.1 Data Query with Corrections

When the server returns scouting data for analysis, it merges corrections at query time:

```sql
-- Effective value for a field: correction takes priority
SELECT
  sr.team_number,
  sr.match_id,
  COALESCE(c.corrected_value, JSON_EXTRACT(sr.data_json, CONCAT('$.', :field))) AS effective_value
FROM scouting_results sr
LEFT JOIN corrections c
  ON  c.event_id    = sr.event_id
  AND c.match_id    = sr.match_id
  AND c.team_number = sr.team_number
  AND c.field_name  = :field
WHERE sr.event_id = :event_id
```

### 13.2 Formula Language

Carried over from v3. Named formulas are stored per event in `formulas` table. The `Expr` evaluator in `shared/` is used by both the NestJS server (for server-side computation) and the Electron renderer.

### 13.3 Datasets

Named match-set filters (`all`, `first N`, `last N`, `range`, `specific`) are stored in `datasets` table. Used to scope formula evaluation and graph data.

### 13.4 Graphs

`IPCGraphConfig` objects stored in `graphs` table. Central and Coach can each own graph configs (same as v3).

### 13.5 Pick Lists

`IPCPickListConfig` objects stored in `picklists` table. Central and Coach can each own pick list configs.

### 13.6 Playoff Bracket

`IPCPlayoffStatus` stored in `playoff_bracket` table (one row per event).

---

## 14. Key Design Decisions

1. **NestJS server shared by cloud and Central** — the same codebase runs both in the cloud and as a child process under Electron on Central. This eliminates duplicate business logic and gives tablets a single, uniform REST API to target.

2. **MySQL on Central (full server)** — using the same database engine on both Central and the cloud simplifies the sync protocol (no schema translation) and avoids ORM compatibility layers.

3. **Corrections as a separate table** — raw scouting data is never overwritten. Corrections are a transparent overlay, always winning at query time. This preserves the audit trail and makes it easy to see what was changed and by whom.

4. **Central wins on conflict** — the scouting lead is the authoritative human operator at the event; their deliberate corrections take priority over any cloud-side edits.

5. **Form format unchanged from v3** — JSON absolute-pixel forms are 100% backward compatible. This allows reuse of v3 form libraries without a migration step.

6. **Tablets fully offline-capable** — all submitted results are queued in local expo-sqlite before upload. Scouts can work through a complete match day without network access and sync at any convenient time.

7. **Per-team API keys (not per-event)** — reduces administrative overhead; a team configures their key once per season in both Central and the tablet app.

8. **Monorepo with shared types** — the `shared/` package contains all cross-boundary TypeScript types (form definitions, API contracts, data value types). All three applications depend on it, ensuring compile-time consistency.

9. **Coach mode in Central Electron app** — the Coach role remains as a separate app personality within the Central executable, avoiding a fourth separate application.

10. **Bidirectional sync with append-only corrections** — scouting results and analysis configs sync both ways; corrections are always appended (never conflict), so all corrections from all sources are preserved.

---

## 15. Logging

| Component | Log destination |
|---|---|
| NestJS server (cloud) | `~/.xeroscout/logs/server-<date>.log` (Winston JSON) |
| NestJS server (Central) | Forwarded to Electron main process Winston logger |
| Electron main process | `~/.xeroscout/logs/central-<date>.log` |
| Renderer process | IPC → main process logger |
| React Native tablet | Console + remote log POST to `/log` endpoint when connected |

---

## 16. Build System

### Central (Electron)

1. Build `shared/`: `tsc`
2. Build `server/`: `nest build` → single `dist/main.js`
3. Build renderer: `tsc` → `webpack` → `xeroapp.bundle.js`
4. Build main: `tsc`
5. Package with Electron Forge → Squirrel/Inno Setup installer (Windows)

The packaged installer bundles the NestJS `dist/main.js` and a compatible Node.js runtime alongside the Electron binary.

### Tablet (React Native / Expo)

- Development: `expo start`
- Production: `eas build` (Expo Application Services)
  - iOS: `.ipa` via App Store Connect
  - Android: `.apk` / `.aab`
  - Windows: `expo run:windows` (React Native Windows)

### Cloud Server

```bash
cd server
npm run build
node dist/main.js
```

Managed via `systemd` service on the Linux VPS.

---

## 17. Migration from XeroScout 3

- **Forms**: V3 JSON form files load directly — no schema change.
- **Data**: V3 SQLite data can be migrated via a one-time import script (`tools/migrate-v3.ts`) that reads the v3 `team.db` and `match.db` and inserts rows into the v4 MySQL `scouting_results` table.
- **Settings**: V3 `event.json` can be parsed to pre-populate event, team, match, and tablet records during migration.
