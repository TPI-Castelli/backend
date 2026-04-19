# Smart City Brescia - Gestione Parcheggi

Prototipo per la gestione smart dei parcheggi cittadini del Comune di Brescia.

## Struttura del progetto

- `backend/`: Node.js Express API con Prisma (PostgreSQL in Docker).
- `frontend-users/`: Applicazione React per i cittadini.
- `frontend-admin/`: Applicazione React per l'amministratore.

## Requisiti

- Node.js (v16+)
- npm

## Istruzioni per l'avvio

### 1. Configurazione Backend

```bash
cd backend
pnpm install

# Avvia il database con Docker
docker-compose up -d

# Una volta che il database è pronto, esegui le migrazioni e il seed:
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
pnpm run seed

# Avvia il server
pnpm run dev
```

Il backend sarà disponibile su `http://localhost:4000`.
Il database PostgreSQL è accessibile su `localhost:5432` con le credenziali definite nel file `.env` e `docker-compose.yml`.

**Utenti di test:**
- User: `user1` / `password1`
- Admin: `admin` / `adminpass`

### 2. Avvio Frontend Cittadini (User)

```bash
cd frontend-users
pnpm install
pnpm run dev
```

Disponibile su `http://localhost:5173` (o la porta indicata da Vite).

### 3. Avvio Frontend Amministratore (Admin)

```bash
cd frontend-admin
pnpm install
pnpm run dev
```

Disponibile su `http://localhost:5174` (o la porta indicata da Vite).

## Funzionalità Realizzate

### Cittadino (User)
1. Login con credenziali fornite.
2. Visualizzazione aree di parcheggio attive.
3. Visualizzazione posti disponibili in tempo reale.
4. Prenotazione posto (durata automatica 1 ora).
5. Visualizzazione storico prenotazioni personali.

### Amministratore (Admin)
1. Login amministrativo.
2. Aggiunta nuove aree di parcheggio (ID, Nome, Capienza).
3. Visualizzazione storico completo di tutte le prenotazioni.
4. Statistiche andamento giornaliero ultimi 30 giorni.

## Note Tecniche
- **Autenticazione**: Gestita tramite JWT salvato in un cookie HTTP-only (sessione).
- **Database**: PostgreSQL (Docker) gestito tramite Prisma ORM.
- **Frontend**: Sviluppato in React + Vite, con proxy configurato per le chiamate API.
