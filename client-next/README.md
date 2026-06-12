Kineo – Refactoring Architetturale da Monolite a Microservizi

## Descrizione del Progetto

Kineo è una piattaforma e-learning progettata per supportare l'apprendimento linguistico attraverso contenuti multimediali interattivi.

Kineo è una piattaforma e-learning pensata per supportare l'apprendimento delle lingue attraverso contenuti video interattivi. Gli utenti possono guardare video suddivisi per livello di difficoltà, seguire i sottotitoli sincronizzati durante la riproduzione, consultare il significato di parole ed espressioni incontrate nei contenuti e salvarle nel proprio dizionario personale. L'obiettivo della piattaforma è favorire un apprendimento più naturale e contestualizzato della lingua, permettendo allo studente di ampliare il proprio vocabolario e monitorare i termini appresi direttamente durante la visione dei video.

Il progetto nasce come applicazione monolitica composta da un unico backend e da un frontend centralizzato. Nell'ambito del corso di Evoluzione del Software, il sistema è stato progressivamente trasformato in un'architettura distribuita basata su microservizi e microfrontend, con l'obiettivo di migliorarne scalabilità, manutenibilità ed evoluzione futura.

La piattaforma distingue due tipologie di utenti:

* Studenti, che utilizzano i contenuti didattici e gli strumenti di supporto allo studio.
* Amministratori, che gestiscono utenti, catalogo e moderazione della piattaforma.

---

## Obiettivi del Refactoring

La migrazione architetturale è stata realizzata perseguendo i seguenti obiettivi:

* Suddivisione delle responsabilità applicative in servizi indipendenti.
* Riduzione dell'accoppiamento tra i moduli software.
* Miglioramento della scalabilità del sistema.
* Introduzione di un API Gateway per la gestione centralizzata delle richieste.
* Introduzione di comunicazioni asincrone tra servizi.
* Introduzione di microfrontend per l'isolamento delle funzionalità lato client.
* Miglioramento della manutenibilità complessiva del progetto.

---

## Evoluzione Architetturale

Il progetto Kineo è nato come applicazione monolitica composta da un unico backend e da un frontend centralizzato.

Durante il corso di Evoluzione del Software il sistema è stato progressivamente trasformato seguendo il pattern Strangler, consentendo una migrazione incrementale verso un'architettura distribuita senza interrompere il funzionamento dell'applicazione.

L'evoluzione ha introdotto:

* Kong come API Gateway centrale.
* Microservizi indipendenti per i diversi domini applicativi.
* RabbitMQ per la comunicazione asincrona tra servizi.
* Database separati per ciascun dominio applicativo.
* Microfrontend basati su Next.js Multi-Zones.
* Containerizzazione tramite Docker e Docker Compose.


Kineo rappresenta un caso di studio di evoluzione architetturale da sistema monolitico a piattaforma distribuita basata su microservizi e microfrontend.

Il progetto ha permesso di applicare concretamente concetti fondamentali dell'ingegneria del software moderna, tra cui Strangler Pattern, API Gateway, comunicazione asincrona, Database-per-Service, containerizzazione e separazione delle responsabilità.

L'architettura risultante permette una maggiore modularità, una migliore manutenibilità e una più semplice evoluzione futura del sistema.
---

## Tecnologie Utilizzate

### Frontend

* Next.js
* React
* JavaScript
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Infrastruttura

* Docker
* Docker Compose
* Kong API Gateway
* RabbitMQ
* Redis

### Versionamento

* Git
* GitHub

---

## Funzionalità Principali

### Autenticazione e Registrazione

Responsabile:

* microservice-auth

Funzionalità:

* Registrazione utenti
* Login
* Gestione JWT
* Gestione ruoli

---

### Gestione Profilo Utente

Responsabile:

* microservice-user

Funzionalità:

* Visualizzazione profilo
* Aggiornamento informazioni personali
* Gestione dati utente

---

### Catalogo Video

Responsabili:

* client-catalogo
* microservice-catalogo

Funzionalità:

* Visualizzazione catalogo
* Filtraggio per livelli linguistici
* Riproduzione video
* Gestione sottotitoli sincronizzati
* Consultazione contenuti didattici

---

### Sistema Commenti

Responsabili:

* client-catalogo
* microservice-commenti

Funzionalità:

* Inserimento commenti
* Risposte ai commenti
* Like ai commenti
* Moderazione amministrativa

---

### Dizionario Personale

Responsabili:

* client-next
* microservice-dizionario

Funzionalità:

* Traduzione parole
* Salvataggio vocaboli
* Gestione dizionario personale
* Supporto allo studio durante la visione dei video

---

### Dashboard Amministrativa

Responsabili:

* client-admin
* microservice-user
* microservice-commenti
* microservice-catalogo

Funzionalità:

* Gestione utenti
* Gestione catalogo video
* Gestione commenti
* Moderazione della piattaforma

---

## Architettura del Sistema

L'architettura finale del progetto è composta dai seguenti livelli.

### Frontend

* client-next (Shell principale)
* client-admin (Microfrontend amministrativo)
* client-catalogo (Microfrontend catalogo video)

### API Gateway

* Kong

Tutte le richieste provenienti dai frontend vengono instradate attraverso Kong, che si occupa di gestire il routing verso i microservizi corretti.

### Microservizi

* microservice-auth
* microservice-user
* microservice-catalogo
* microservice-commenti
* microservice-dizionario

Ogni servizio possiede responsabilità specifiche e può essere sviluppato ed evoluto indipendentemente dagli altri.

### Comunicazione Asincrona

* RabbitMQ

RabbitMQ viene utilizzato per propagare eventi tra i servizi e garantire la consistenza dei dati distribuiti.

### Persistenza

Ogni microservizio possiede un database dedicato su MongoDB Atlas secondo il pattern Database-per-Service.

-------------


## Installazione e Avvio Locale

### Prerequisiti

Installare:

* Git
* Node.js
* Docker Desktop

Assicurarsi che Docker Desktop sia in esecuzione.

---

### Clonazione del Repository

git clone <https://github.com/rubinochri/Kineo.git>
cd KINEO-TEST-API-GATEWAY

---

### Avvio dell'Infrastruttura Backend

Dalla cartella principale del progetto:

docker compose up --build


Questo comando avvia:

* Kong Gateway
* RabbitMQ
* Redis
* Tutti i microservizi backend

---

### Avvio dei Frontend

Aprire 3 terminali separati.

1 Frontend principale:

cd client-next
npm install
npm run dev

2 Dashboard amministrativa:

cd client-admin
npm install
npm run dev

3 Catalogo video:

cd client-catalogo
npm install
npm run dev

---

## Come Iniziare

### Accesso Studente

1. Aprire il browser e visitare:

http://localhost:3000


2. Registrare un nuovo account oppure effettuare il login.
3. Accedere al catalogo video.
4. Selezionare un contenuto didattico.
5. Utilizzare il dizionario integrato per salvare parole e traduzioni.
6. Gestire il proprio profilo personale.

---

### Accesso Amministratore

Utilizzare un account amministratore esistente:

Email:  admin@kineo.com

Password: adminKineo2026

Dopo il login sarà possibile accedere alla dashboard amministrativa e gestire utenti, contenuti e commenti della piattaforma.

---

## Versioni Utilizzate

| Tecnologia | Versione |
|------------|-----------|
| Node.js | 24.13.0 (sviluppo locale) / 20 (Docker) |
| npm | 11.6.2 |
| Next.js | 16.1.6 |
| React | 19.2.3 |
| Docker | 29.4.0 |
| Docker Compose | 5.1.1 |
| Kong | 3.6.1 |
| RabbitMQ | 3-management |
| Redis | 8.8.0 |
| MongoDB Atlas | 8.0.24 |
| Express | 5.2.1 |
| Mongoose | 9.6.3 (Auth, Commenti, Dizionario) / 8.24.0 (User, Catalogo) |

---

## Struttura del Progetto

KINEO-TEST-API-GATEWAY
│
├── client-next
│   └── Frontend principale (Shell)
│
├── client-admin
│   └── Microfrontend amministrativo
│
├── client-catalogo
│   └── Microfrontend catalogo video
│
├── microservice-auth
│   └── Autenticazione e registrazione
│
├── microservice-user
│   └── Gestione utenti
│
├── microservice-catalogo
│   └── Gestione catalogo video
│
├── microservice-commenti
│   └── Gestione commenti
│
├── microservice-dizionario
│   └── Gestione dizionario personale
│
├── kong.yml
│   └── Configurazione API Gateway
│
├── docker-compose.yml
│   └── Orchestrazione dei servizi backend e infrastrutturali
│
└── README.md

## Conclusioni
