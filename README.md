# Strideboard

A Project Management Platform.

[Live Demo](https://strideboard.vercel.app/)

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
