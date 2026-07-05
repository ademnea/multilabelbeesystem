# System Architecture Overview

This document explains how the Farmer Audio Recording Server works and how different users interact with it.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FARMER AUDIO RECORDING SERVER                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Server Owner's Computer                  │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Docker Container (farmer-sim)                       │ │ │
│  │  │                                                       │ │ │
│  │  │  FastAPI Server (Port 8000)                          │ │ │
│  │  │  ├─ Admin Endpoints (requires Admin Key)             │ │ │
│  │  │  │  ├─ POST /admin/keys (create API key)             │ │ │
│  │  │  │  ├─ GET /admin/keys (list API keys)               │ │ │
│  │  │  │  └─ DELETE /admin/keys/{key} (revoke)             │ │ │
│  │  │  │                                                    │ │ │
│  │  │  └─ Data Endpoints (requires API Key)                │ │ │
│  │  │     ├─ GET /recordings (list files)                  │ │ │
│  │  │     └─ GET /recordings/{filename} (download)         │ │ │
│  │  │                                                       │ │ │
│  │  │  Data Storage:                                        │ │ │
│  │  │  ├─ /data/api_keys.json (API key database)           │ │ │
│  │  │  └─ /home/farmer/recordings/{api_key}/{hive_name}/   │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  ngrok Tunnel                                         │ │ │
│  │  │  localhost:8000 → https://xyz.ngrok-free.dev         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Integrator A  │    │ Integrator B  │    │ Integrator C  │
│               │    │               │    │               │
│ API Key: xxx  │    │ API Key: yyy  │    │ API Key: zzz  │
│               │    │               │    │               │
│ Sees only:    │    │ Sees only:    │    │ Sees only:    │
│ recordings/   │    │ recordings/   │    │ recordings/   │
│   xxx/*.wav   │    │   yyy/*.wav   │    │   zzz/*.wav   │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## User Roles and Responsibilities

### 1. Server Owner (Administrator)

**Who:** The farmer who owns the beehive recordings

**Responsibilities:**
- Install and configure the server
- Generate and manage the admin key
- Upload audio recordings to the server
- Create API keys for external users
- Manage user access (revoke keys if needed)
- Keep the server running and accessible

**Tools Used:**
- Docker (to run the server)
- ngrok (to expose server to internet)
- Admin Key (to manage API keys)

**Does NOT:**
- Download recordings via API (has direct file access)
- Use API keys (generates them for others)

---

### 2. External Integrator (API Consumer)

**Who:** Users who want to access recordings (e.g., BSADS users, researchers)

**Responsibilities:**
- Receive Server URL and API Key from server owner
- Poll the server for new recordings
- Download and process recordings
- Integrate recordings into their systems

**Tools Used:**
- API Key (to authenticate requests)
- HTTP client (curl, Python requests, etc.)
- Polling script (to check for new files)

**Does NOT:**
- Install or manage the server
- Have access to admin endpoints
- See other users' recordings

---

## Data Flow

### Creating an API Key

```
Server Owner                    Server                    Database
     │                            │                          │
     │  1. POST /admin/keys       │                          │
     │  Header: X-Admin-Key       │                          │
     │  Body: {client_name}       │                          │
     ├───────────────────────────>│                          │
     │                            │  2. Validate admin key   │
     │                            │                          │
     │                            │  3. Generate UUID        │
     │                            │     (API key)            │
     │                            │                          │
     │                            │  4. Save to database     │
     │                            ├─────────────────────────>│
     │                            │                          │
     │  5. Return API key         │                          │
     │<───────────────────────────┤                          │
     │                            │                          │
     │  6. Share API key with     │                          │
     │     external integrator    │                          │
     │                            │                          │
```

### Listing Recordings

```
External Integrator            Server                    File System
     │                            │                          │
     │  1. GET /recordings        │                          │
     │  Header: X-API-Key         │                          │
     ├───────────────────────────>│                          │
     │                            │  2. Validate API key     │
     │                            │                          │
     │                            │  3. Get user directory   │
     │                            │     /recordings/{key}/   │
     │                            │                          │
     │                            │  4. List *.wav files     │
     │                            ├─────────────────────────>│
     │                            │<─────────────────────────┤
     │                            │                          │
     │  5. Return file list       │                          │
     │<───────────────────────────┤                          │
     │                            │                          │
```

### Downloading a Recording

```
External Integrator            Server                    File System
     │                            │                          │
     │  1. GET /recordings/file   │                          │
     │  Header: X-API-Key         │                          │
     ├───────────────────────────>│                          │
     │                            │  2. Validate API key     │
     │                            │                          │
     │                            │  3. Check file exists    │
     │                            │     in user's directory  │
     │                            │                          │
     │                            │  4. Read file            │
     │                            ├─────────────────────────>│
     │                            │<─────────────────────────┤
     │                            │                          │
     │  5. Stream WAV file        │                          │
     │<───────────────────────────┤                          │
     │                            │                          │
```

---

## Security Model

### Authentication Levels

```
┌─────────────────────────────────────────────────────────┐
│                     Admin Key                            │
│  - Full control over server                              │
│  - Can create/list/revoke API keys                       │
│  - NEVER shared with external users                      │
│  - Stored in .env file                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ generates
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     API Keys                             │
│  - Read-only access to recordings                        │
│  - Each key has isolated directory                       │
│  - Shared with external integrators                      │
│  - Stored in data/api_keys.json                          │
└─────────────────────────────────────────────────────────┘
```

### Data Isolation

Each API key has its own directory:

```
recordings/
├── f47ac10b-58cc-4372-a567-0e02b2c3d479/  ← User A's recordings
│   ├── hive1_2024-05-01.wav
│   ├── hive1_2024-05-02.wav
│   └── hive2_2024-05-01.wav
│
├── 8b3d9e2a-1234-5678-9abc-def012345678/  ← User B's recordings
│   ├── apiary_a_morning.wav
│   └── apiary_a_evening.wav
│
└── c5f8a3b2-9876-5432-1abc-fedcba987654/  ← User C's recordings
    └── test_recording.wav
```

**Security Features:**
- ✅ Users can only list files in their own directory
- ✅ Users cannot access files in other directories
- ✅ Path traversal attacks are prevented
- ✅ Server validates all file paths

---

## Network Architecture

### Local Network

```
┌─────────────────────────────────────────┐
│  Server Owner's Computer                 │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Docker Container                   │ │
│  │  Port: 8000                         │ │
│  │  Bind: 0.0.0.0 (all interfaces)     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Accessible at:                          │
│  - http://localhost:8000                 │
│  - http://192.168.x.x:8000 (LAN)         │
└─────────────────────────────────────────┘
```

### Public Internet (via ngrok)

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
│                                                          │
│  External Integrators                                    │
│  ├─ User A (from anywhere)                               │
│  ├─ User B (from anywhere)                               │
│  └─ User C (from anywhere)                               │
│                                                          │
│                    │                                     │
│                    │ HTTPS                               │
│                    ▼                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ngrok Cloud Service                              │   │
│  │  https://xyz.ngrok-free.dev                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Tunnel
                     ▼
┌─────────────────────────────────────────┐
│  Server Owner's Computer                 │
│  (behind firewall, no public IP needed)  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ngrok Client                       │ │
│  │  Forwards to localhost:8000         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Docker Container                   │ │
│  │  Port: 8000                         │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Benefits of ngrok:**
- ✅ No public IP address required
- ✅ No router configuration needed
- ✅ Automatic HTTPS encryption
- ✅ Works behind firewalls
- ⚠️ Free tier: URL changes on restart

---

## Typical Workflows

### Workflow 1: Server Owner Setup

```
1. Install Docker and ngrok
   ↓
2. Generate admin key (openssl rand -hex 32)
   ↓
3. Create .env file with admin key
   ↓
4. Start server (docker compose up -d)
   ↓
5. Start ngrok tunnel (ngrok http 8000)
   ↓
6. Copy ngrok URL (https://xyz.ngrok-free.dev)
   ↓
7. Generate API key for user
   ↓
8. Share URL + API key with user
```

### Workflow 2: External Integrator Setup

```
1. Receive Server URL and API Key
   ↓
2. Test connection (curl /health)
   ↓
3. Test API access (curl /recordings)
   ↓
4. Set up polling script
   ↓
5. Configure download directory
   ↓
6. Run automated polling
   ↓
7. Process downloaded recordings
```

### Workflow 3: Adding New Recordings

```
Server Owner:
1. Place new .wav files in recordings/{api_key}/{hive_name}/
   ↓
2. Files are immediately available
   ↓
External Integrator:
3. Next poll detects new files
   ↓
4. Downloads new files automatically
   ↓
5. Processes new recordings
```

---

## Technology Stack

### Server Side

```
┌─────────────────────────────────────────┐
│  Operating System: Linux/Mac/Windows     │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Docker Container                   │ │
│  │                                     │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │  Python 3.11                  │  │ │
│  │  │  ├─ FastAPI (web framework)   │  │ │
│  │  │  ├─ Uvicorn (ASGI server)     │  │ │
│  │  │  └─ Pydantic (validation)     │  │ │
│  │  └──────────────────────────────┘  │ │
│  │                                     │ │
│  │  Volumes:                            │ │
│  │  ├─ ./recordings → /home/farmer/... │ │
│  │  └─ ./data → /data                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ngrok                              │ │
│  │  (Tunnel to internet)               │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Client Side

```
┌─────────────────────────────────────────┐
│  Any Operating System                    │
│                                          │
│  HTTP Client:                            │
│  ├─ Python + requests library            │
│  ├─ curl (command line)                  │
│  ├─ Node.js + axios                      │
│  └─ Any HTTP client                      │
│                                          │
│  Requirements:                           │
│  ├─ Internet connection                  │
│  ├─ HTTPS support                        │
│  └─ API Key from server owner            │
└─────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Design (Single Server)

```
1 Server Owner → 1 Server → N External Integrators
```

**Limitations:**
- Single point of failure
- Limited by server owner's bandwidth
- ngrok free tier has connection limits

**Suitable for:**
- Small-scale deployments
- Individual farmers
- Research projects
- Proof of concept

### Future Enhancements

**For larger deployments, consider:**
1. **Cloud hosting** (AWS, Azure, GCP) instead of local server
2. **Static public IP** instead of ngrok
3. **Load balancer** for multiple servers
4. **CDN** for file distribution
5. **Database** instead of JSON file for API keys
6. **Rate limiting** to prevent abuse
7. **Monitoring** and alerting

---

## Summary

This architecture provides:
- ✅ **Simple setup** for server owners
- ✅ **Easy integration** for API consumers
- ✅ **Data isolation** between users
- ✅ **Secure authentication** with API keys
- ✅ **No public IP required** (via ngrok)
- ✅ **Automatic HTTPS** encryption
- ✅ **Scalable** to multiple users

**Key Principle:** The server owner maintains full control over their data while providing secure, isolated access to external integrators.
