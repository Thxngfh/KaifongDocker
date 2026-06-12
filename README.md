# Kaifong Docker Setup

### Project Structure

```text
KaifongDocker/
├── docker-compose.yml
├── kaifongai/
│   └── Dockerfile
└── kaifongliff/
    └── Dockerfile
```

### วิธีการใช้งาน

1. Clone Repository

```bash
git clone https://github.com/Thxngfh/KaifongDocker.git
cd KaifongDocker
```

2. Build และ Run Container

```bash
docker compose up --build
```

### Services

| Service      | URL                   |
| ------------ | --------------------- |
| Kaifong LIFF | http://localhost:3000 |
| Kaifong AI   | http://localhost:3001 |
