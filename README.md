# Doc Generator API

API Node.js/TypeScript de génération de documents PDF en batch.

## Architecture
```
POST /api/documents/batch
        │
        ▼
   Bull Queue (Redis)
        │
        ▼
   PDF Worker (pdfkit)
        │
        ▼
   MongoDB (documents)
```

## Choix techniques

- **Bull** : file d'attente robuste avec Redis, retry automatique, backoff exponentiel
- **pdfkit** : génération PDF légère sans browser headless, streaming natif
- **GridFS** : stockage de fichiers binaires dans MongoDB sans limite de taille
- **opossum** : circuit breaker pour les appels externes (DocuSign)
- **pino** : logger JSON ultra-rapide avec corrélation batchId/documentId
- **prom-client** : métriques Prometheus standards

## Démarrage rapide
```bash
docker compose up --build -d
```

## Services

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api-docs |
| Health | http://localhost:3000/health |
| Metrics | http://localhost:3000/metrics |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |

## Endpoints

### POST /api/documents/batch
```bash
curl -X POST http://localhost:3000/api/documents/batch \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user-1", "user-2", "user-3"]}'
```

### GET /api/documents/batch/:batchId
```bash
curl http://localhost:3000/api/documents/batch/{batchId}
```

### GET /api/documents/:documentId
```bash
curl http://localhost:3000/api/documents/{documentId}
```

## Benchmark
```bash
npx ts-node benchmark/runBatch.ts
```

Résultats obtenus :
- 1000 documents en 30 secondes
- 33.3 docs/seconde
- 0 échecs
- CPU : 875ms user

## Variables d'environnement

Copie `.env.example` en `.env` et adapte les valeurs.

## Tests
```bash
npm test
```