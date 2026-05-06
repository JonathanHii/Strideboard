# Strideboard

A project management app I built end-to-end. You can create workspaces, invite members, set up projects, and track work on a Kanban board that updates in real time across all connected users.

[Live Demo](https://strideboard.vercel.app/)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Spring Boot 3, Spring Security, Spring Data JPA |
| Database | PostgreSQL 15 |
| Auth | JWT (RSA asymmetric keys) via Spring OAuth2 Resource Server |
| Real-Time | WebSocket (STOMP over SockJS) |
| Drag & Drop | @hello-pangea/dnd |
| Deployment | Vercel (frontend), AWS EC2 (backend), Docker Compose (local) |

---

## Architecture

```
[Next.js :3000]  ──REST/HTTP──▶  [Spring Boot API :8080]  ──JPA──▶  [PostgreSQL]
       │                                    │
       └────────WebSocket (STOMP/SockJS)────┘
```

The frontend talks to the backend via REST for all data operations. I kept API calls out of components by putting them in service modules (`work-item-service.ts`, `workspace-service.ts`, etc.) so the components just deal with state and rendering.

On top of REST, there's a WebSocket connection that opens when a user lands on a project board. The server uses this to push work item changes to every connected client in real time, so the board stays in sync without polling.

Docker Compose runs all three services together — `postgres`, `server` (Spring Boot), and `client` (Next.js). The server is set to `depends_on` postgres so it won't start before the database is ready.

---

## Data Model

The hierarchy is: **User → Workspace → Project → Work Item**

- A **User** can be in many **Workspaces** through a **Membership** record (role: `ADMIN`, `MEMBER`, or `VIEWER`)
- A **Workspace** has many **Projects**
- A **Project** has many **Work Items**
- A **Work Item** has a creator, an optional assignee, and these enum fields:

| Field | Values |
|---|---|
| Status | `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE` |
| Priority | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| Type | `TASK`, `BUG`, `EPIC`, `STORY` |

Each work item also has a `Double position` for ordering within its column. New items get `maxPosition + 1000`. When you drag and drop, the new position is the midpoint of the two surrounding items, so nothing else needs to be renumbered.

---

## Authentication

Stateless JWT auth using RSA asymmetric keys.

**Flow:**
1. Client hits `POST /api/auth/login` (HTTP Basic) or `POST /api/auth/register`
2. `AuthController` calls `TokenService` which builds a JWT signed with the RSA private key — 24hr expiry, subject is the user's email
3. The token is returned as a plain string, stored in `localStorage`
4. Every request after that sends it as `Authorization: Bearer <token>`
5. Spring Security's OAuth2 Resource Server filter validates the signature using the RSA public key on every request — no database hit needed

Using asymmetric keys means the private key only lives on the server. If this ever scaled to multiple services, each one could verify tokens using just the public key without needing access to the private key.

> **Note:** Passwords are currently stored in plain text (`NoOpPasswordEncoder`). Swapping to `BCryptPasswordEncoder` is a one-liner in Spring Security — I left it as-is during development to keep debugging simple.

**Role checks:** Every endpoint that writes data checks the user's `Membership.role` for that workspace first. VIEWERs get a `403` on create, update, and delete.

---

## Real-Time Sync (WebSocket)

When someone creates, updates, or deletes a work item, every other user on the same board sees it immediately without refreshing.

**Server — `WebSocketConfig.java`**

Two STOMP prefixes are configured:
- `/topic` — for server-to-client broadcasts
- `/app` — for client-to-server messages (unused here since all writes go through REST)

The WebSocket handshake endpoint is `/ws`, wrapped with SockJS as a fallback for environments that block WebSocket connections.

**Server — `WorkItemController.java`**

After every successful save or delete, the controller broadcasts to all subscribers:

```java
messagingTemplate.convertAndSend("/topic/project/" + projectId, event);
```

The `WorkItemSocketEvent` payload has three fields: `type` (CREATED / UPDATED / DELETED), `workItem` (the full object, null on delete), and `workItemId` (only set on delete since the item no longer exists in the DB).

**Client — `use-project-socket.ts`**

When the board mounts, a custom hook connects to `/ws` via STOMP over SockJS and subscribes to the project-specific topic:

```typescript
client.subscribe(`/topic/project/${projectId}`, (message) => {
    const event: SocketEvent = JSON.parse(message.body);
    onEvent(event);
});
```

When the component unmounts (navigating away), the hook disconnects to clean up.

**Client — `board/page.tsx`**

The board passes a callback into the hook that handles each event type:

- `CREATED` — appends the item to state, with a duplicate check so the person who just created it doesn't see it added twice
- `UPDATED` — swaps the matching item in state by ID, then re-sorts by position so drag order stays correct
- `DELETED` — filters the item out by ID

The green/red dot in the toolbar shows whether the WebSocket is currently connected.

**Full flow — User A creates an item, User B sees it:**

```
User A submits the "New Item" form
  → POST /api/projects/{workspaceId}/{projectId}/work-items

Spring Boot:
  1. Validates JWT
  2. Checks membership role (blocks VIEWER)
  3. Validates the project belongs to the workspace
  4. Saves WorkItem to PostgreSQL
  5. Saves a Notification if assignee != creator
  6. messagingTemplate.convertAndSend(
       "/topic/project/{projectId}",
       WorkItemSocketEvent(CREATED, savedItem, null)
     )
  7. Returns 200 + the saved item to User A

STOMP broker pushes the message to all subscribers on that topic

User B's board (already open on the same project):
  → subscription callback fires
  → event.type === 'CREATED'
  → setItems(prev => [...prev, event.workItem])
  → React re-renders, new card appears on the board
```

---

## Drag and Drop

Built with `@hello-pangea/dnd` (a maintained fork of `react-beautiful-dnd`).

When you drop a card, `onDragEnd` runs:
1. Snapshots the current item list so it can roll back if needed
2. Calculates the new position as the midpoint between the surrounding items
3. Updates React state immediately so the UI doesn't wait (optimistic update)
4. Sends a `PATCH` to the API with the updated `status` and `position`
5. If the API call fails, restores the snapshot

Using floating-point midpoints means you never have to touch any other item's position when reordering. The server stores positions and returns them, so the order is consistent for all users.

---

## Notifications

Whenever a work item is assigned to someone (on create or update), a `Notification` record is written to the database with:
- `title`: "New Task Assigned" or "Task Updated"
- `subtitle`: the work item's title
- Links to the recipient, workspace, and work item

The client fetches these separately and shows them in a notification inbox. Assigning something to yourself doesn't trigger a notification — there's an explicit check for `assignee.getId().equals(creator.getId())`.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/JonathanHii/Strideboard
cd Strideboard
```

### 2. Configure Environment Variables

**Root Directory**  
Create a `.env` file in the project root (`/Strideboard/.env`):

```env
DB_USER=postgres
DB_PASSWORD=your_super_secret_password
DB_NAME=strideboard
NEXT_PUBLIC_API_URL=http://localhost:8080/api
CLIENT_URL=http://localhost:3000
```

**Client Directory**  
Create a `.env` file in the client folder (`/Strideboard/client/.env`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Run the Application

Start the database, backend, and frontend using Docker Compose:

```bash
docker compose up --build
```

* **Frontend:** [http://localhost:3000](http://localhost:3000)  
* **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
