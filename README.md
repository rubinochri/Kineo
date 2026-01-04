# Kineo: L'Apprendimento Linguistico 3.0

> **Transforming Entertainment into Education.**
> Kineo colma il divario tra lo streaming video passivo e lo studio linguistico strutturato.

## Descrizione del Progetto

Kineo è una Web App Full-Stack che permette agli utenti di apprendere l'inglese guardando contenuti video (tratti da YouTube) arricchiti da **sottotitoli interattivi e contestuali**.

A differenza dei player tradizionali, Kineo non si limita a tradurre le parole: grazie a un processo di elaborazione basato su Intelligenza Artificiale, il sistema riconosce **modi di dire (idioms)**, **verbi frasali** e **regole grammaticali**, offrendo spiegazioni mirate istantanee senza interrompere il flusso della visione.

## Funzionalità Chiave

### 🎬 Smart Video Player
- Integrazione seamless di video **YouTube** (senza reindirizzamenti esterni).
- Sottotitoli sincronizzati con navigazione temporale cliccabile.
- **Smart Tooltips**: Cliccando su parole o frasi evidenziate, l'utente riceve una spiegazione didattica (non solo una traduzione letterale).

### Vocabolario Personale (Learning Notebook)
- Gli utenti possono salvare specifici termini o espressioni incontrate nei video.
- Ogni voce salvata mantiene il riferimento al contesto originale (video e frase).
- Gestione dello stato di apprendimento ("Da studiare", "Imparato").

### Social Learning
- Sistema di **Commenti Temporizzati**: Gli utenti possono lasciare commenti legati a un preciso secondo del video, facilitando discussioni su battute specifiche o dubbi linguistici.

##  Architettura Tecnica & Workflow AI

Il progetto adotta un approccio **"AI Caching" con Human-in-the-Loop** per garantire zero latenza all'utente finale e massima precisione didattica.

### Il flusso di gestione dei dati:
1.  **Ingestion:** L'amministratore seleziona un video didatticamente valido.
2.  **AI Processing:** Il contenuto viene analizzato tramite **LLM (Google Gemini)** per ottenere:
    - Trascrizione segmentata temporalmente.
    - Traduzione contestuale (non letterale).
    - Estrazione di token complessi (Idiomi, Phrasal Verbs).
3.  **Data Caching:** I metadati arricchiti (JSON) vengono salvati in modo permanente su **MongoDB**.
4.  **Fruizione:** Il frontend React recupera i dati dal DB istantaneamente, senza effettuare chiamate API costose o lente verso servizi AI esterni durante la visione.

## Tech Stack (MERN)

**Frontend:**
- React.js
- Material UI (MUI)
- React Player (YouTube Wrapper)
- Redux Toolkit (State Management)

**Backend:**
- Node.js
- Express.js

**Database:**
- MongoDB (con Mongoose ODM)
- Struttura a documenti nidificati per la gestione ottimizzata dei segmenti di sottotitoli.

## Modello Dati (E-R Semplificato)

Il database è strutturato attorno a 6 entità principali:
- **Video:** Metadati e link alla risorsa streaming.
- **Segmento:** La singola frase sincronizzata temporalmente.
- **Approfondimento (Smart Token):** L'elemento didattico (idioma/regola) associato al segmento.
- **Utente:** Gestione profili e ruoli.
- **Voce Vocabolario:** Collegamento tra Utente e Approfondimento salvato.
- **Commento:** Interazione sociale temporizzata.

## Team di Sviluppo

Progetto realizzato per il corso di [Nome del Corso] - Università degli Studi di Bari Aldo Moro.

- **[Christian Rubino]** - *[Ruolo, es. Backend & DB]*
- **[Giuseppe Tucci]** - *[Ruolo, es. Frontend & UI]*
- **[Michele Nettis]** - *[Ruolo, es. AI Data Engineering]*

---
*Developed with ❤️ and ☕ using MERN Stack.*
