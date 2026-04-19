# Relazione Tecnica - Smart City Brescia - Gestione Parcheggi

## 1. Introduzione
Il progetto consiste in un sistema avanzato per la gestione dei parcheggi cittadini della città di Brescia. Il sistema è composto da un backend centralizzato e due interfacce frontend distinte: una dedicata ai cittadini per la prenotazione in tempo reale e una dedicata agli amministratori per il monitoraggio, l'analisi dei dati e la gestione del sistema.

## 2. Tecnologie Utilizzate

### Backend
- **Node.js & Express**: Ambiente di runtime e framework web per la gestione delle API REST e della logica di business.
- **TypeScript**: Linguaggio di programmazione che aggiunge tipizzazione statica a JavaScript, garantendo maggiore robustezza e manutenibilità.
- **Prisma ORM**: Object-Relational Mapper utilizzato per interagire con il database in modo sicuro e tipizzato.
- **PostgreSQL (Docker)**: Database relazionale scelto per la sua scalabilità e affidabilità, eseguito all'interno di un container Docker per isolare l'ambiente.
- **Socket.io**: Libreria per la comunicazione bidirezionale in tempo reale basata su WebSockets.
- **bcrypt**: Utilizzato per l'hashing sicuro delle password degli utenti (standard di settore).
- **jsonwebtoken (JWT)**: Tecnologia utilizzata per la gestione sicura delle sessioni e dell'autenticazione.

### Frontend
- **React.js (Vite)**: Framework per la creazione di interfacce utente reattive e performanti.
- **Recharts**: Libreria utilizzata per la visualizzazione dei dati storici e dei trend di occupazione tramite grafici interattivi.
- **Axios**: Client HTTP per la comunicazione con il backend, configurato con interceptor per la gestione della sicurezza.
- **Socket.io-client**: Client per ricevere aggiornamenti istantanei dal server senza ricaricare la pagina.

## 3. Funzionamento dei Componenti Chiave

### Autenticazione con JWT (JSON Web Token)
L'autenticazione è gestita tramite **JWT** per garantire sicurezza e scalabilità:
1. **Login**: Quando l'utente inserisce le credenziali, il server le verifica. Se corrette, crea un token firmato digitalmente con una chiave segreta (`JWT_SECRET`).
2. **Payload**: Il token contiene informazioni criptate ma verificabili, come l'ID utente (`sub`) e il suo ruolo (`role`).
3. **Cookie Sicuri (httpOnly)**: Il token viene inviato al browser in un cookie con flag `httpOnly`. Questo impedisce a script malevoli (XSS) di accedere al token, proteggendo l'identità dell'utente.
4. **Isolamento delle Sessioni**: Per evitare conflitti tra Admin e Utenti sullo stesso computer, il sistema utilizza cookie separati (`sb_admin_token` e `sb_token`). Il backend utilizza un header personalizzato (`x-admin-request`) per decidere quale sessione prioritizzare.

### Comunicazione Real-time con WebSockets
A differenza delle applicazioni tradizionali che richiedono il refresh della pagina (polling), questo sistema utilizza **WebSockets** tramite Socket.io:
- Ogni volta che avviene un evento rilevante (nuova prenotazione, scadenza di un posto, creazione di un'area), il server emette un evento (`bookingUpdated`).
- Tutti i frontend connessi ricevono immediatamente il segnale e ricaricano i dati in background.
- Questo garantisce che la disponibilità dei posti visualizzata dai cittadini sia sempre corretta al secondo.

### Architettura del Software: Middleware e Routes
L'applicazione backend è strutturata seguendo il pattern **Controller-Middleware**, che separa la logica di accesso dalla logica di business:

#### 1. Middleware (I "Guardiani" del sistema)
I middleware sono funzioni che filtrano ogni richiesta prima che raggiunga le rotte finali:
- **`verifyToken`**: È il middleware principale. Estrae il JWT dai cookie (`sb_token` o `sb_admin_token`) e ne verifica l'integrità. Se il token è valido, "attacca" i dati dell'utente alla richiesta (`req.user`), altrimenti blocca la chiamata con un errore `401 Unauthorized`. È stato programmato per distinguere tra richieste admin e utente tramite l'header `x-admin-request`.
- **`requireRole('admin')`**: Questo middleware viene eseguito dopo la verifica del token. Controlla se il ruolo salvato nel JWT corrisponde a quello richiesto. Se un utente normale tenta di accedere a rotte amministrative, viene bloccato con un errore `403 Forbidden`.
- **`ensureSameUserOrAdmin`**: Utilizzato per la privacy dei cittadini, garantisce che un utente possa vedere solo le proprie prenotazioni, a meno che non sia un amministratore.

#### 2. Routes (La logica di business)
Le rotte sono organizzate per moduli per garantire manutenibilità:
- **`auth.ts`**: Gestisce il ciclo di vita della sessione (Login, Logout, verifica `/me`). Gestisce anche la gestione utenti (CRUD) riservata agli admin.
- **`areas.ts`**: Si occupa della definizione geografica dei parcheggi. Calcola dinamicamente la disponibilità dei posti sottraendo le prenotazioni attive dalla capienza totale.
- **`bookings.ts`**: È il modulo più complesso. Gestisce la creazione delle prenotazioni, la persistenza dei dati storici (`areaName`) e coordina l'automazione delle scadenze tramite timer asincroni.

### Gestione delle Prenotazioni e Scadenza Automatica
Le prenotazioni hanno una durata dinamica configurabile tramite variabili d'ambiente (`BOOKING_DURATION_MINUTES` nel file `.env`).
- Al momento della prenotazione, il server calcola il timestamp di fine e programma un **timer interno**.
- Allo scadere del tempo, il server invia automaticamente una notifica a tutti i client per liberare il posto nell'interfaccia, garantendo un'automazione totale senza intervento umano.

### Integrità dei Dati e Storico
Il sistema è progettato per non perdere mai informazioni:
- **Eliminazione Area**: Se un amministratore elimina un parcheggio, il database è configurato per mantenere tutte le prenotazioni passate associate a quell'area (`onDelete: SetNull`).
- **Snapshot dei Dati**: Ogni prenotazione salva il nome dell'area al momento dell'acquisto (`areaName`). In questo modo, i log storici e le statistiche rimangono leggibili e accurati anche se il parcheggio fisico viene rimosso dal sistema.

## 4. Design e Interfaccia (UI/UX)
- **Enterprise Dark Theme**: Entrambi i portali utilizzano un tema scuro professionale ispirato agli standard dei software enterprise moderni (es. GitHub Dark).
- **Layout Fissi**: Le card informative utilizzano intestazioni fisse e aree di scorrimento indipendenti, permettendo di navigare tra centinaia di log o statistiche senza mai perdere di vista il contesto della sezione.
- **Visualizzazione Dati**: L'amministratore dispone di barre di avanzamento dinamiche (che cambiano colore in base all'occupazione) e grafici a linee per analizzare l'andamento settimanale delle prenotazioni.

## 5. Manutenzione e Testing
Il sistema include uno script di generazione dati mock (`prisma/mock_data.ts`) che permette di popolare istantaneamente il database con centinaia di prenotazioni casuali. Questo è essenziale per stress-testare la reattività dei grafici e dei sistemi real-time durante la fase di sviluppo e revisione.

## 6. Testing delle API
Per la verifica e il collaudo del backend, è stato predisposto un sistema di test integrato direttamente nell'ambiente di sviluppo:
- **File di Test**: In `backend/api-tests.http` sono definiti tutti gli endpoint del sistema, raggruppati per funzionalità (Autenticazione, Utenti, Aree, Prenotazioni).
- **REST Client**: Si raccomanda l'uso dell'estensione **REST Client** per VS Code. Questo strumento permette di inviare richieste HTTP reali al server con un solo click ("Send Request"), gestendo automaticamente i cookie di sessione e permettendo di verificare istantaneamente le risposte JSON e gli status code.
- **Simulazione Frontend**: I test sono configurati per includere gli header di sicurezza (`x-admin-request`) e i flag di ruolo, simulando fedelmente il comportamento dei due portali frontend.

## 7. Conclusioni
Il prototipo realizzato risponde pienamente ai requisiti di modernità, sicurezza e reattività richiesti. L'architettura modulare e l'uso di standard industriali (JWT, WebSockets, PostgreSQL) lo rendono pronto per un'eventuale evoluzione verso un sistema di produzione su larga scala.
