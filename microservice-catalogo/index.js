const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Video = require('./models/Video');
const { connectRabbitMQ, publishVideoDeleted } = require('./rabbitmq');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connesso - Microservizio Catalogo');
    connectRabbitMQ();
  })
  .catch(errore => console.error('Errore connessione DB Catalogo:', errore));

/*
  MICROSERVIZIO CATALOGO

  Questo servizio contiene solo le rotte relative ai video.
  Le rotte sono state estratte dal monolite server/index.js.
*/

// GET: Recupera la lista completa dei video
app.get('/api/videos', async (req, res) => {
  try {
    const listaVideo = await Video.find();
    res.json(listaVideo);
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});

// GET: Recupera un singolo video tramite ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const videoTrovato = await Video.findById(req.params.id);

    if (!videoTrovato) {
      return res.status(404).json({ message: 'Video non trovato' });
    }

    res.json(videoTrovato);
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});

// POST: Crea un nuovo video
app.post('/api/videos', async (req, res) => {
  try {
    const {
      titolo,
      url,
      livelloDifficolta,
      copertina,
      descrizione,
      serie,
      episodio
    } = req.body;

    if (!titolo || !url || !livelloDifficolta) {
      return res.status(400).json({
        message: 'Titolo, URL e Livello Difficoltà sono obbligatori.'
      });
    }

    const nuovoVideo = new Video({
      titolo,
      url,
      livelloDifficolta,
      copertina,
      descrizione,
      serie: serie || '',
      episodio: episodio || '',
      segmenti: []
    });

    const videoSalvato = await nuovoVideo.save();
    res.status(201).json(videoSalvato);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// PATCH: Aggiorna parzialmente i dati di un video
app.patch('/api/videos/:id', async (req, res) => {
  try {
    const datiAggiornamento = req.body;

    const videoModificato = await Video.findByIdAndUpdate(
      req.params.id,
      datiAggiornamento,
      { new: true, runValidators: true }
    );

    if (!videoModificato) {
      return res.status(404).json({ message: 'Video non trovato' });
    }

    res.json(videoModificato);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// PATCH: Aggiorna i segmenti/sottotitoli di un video
app.patch('/api/videos/:id/segmenti', async (req, res) => {
  try {
    const { segmenti } = req.body;

    if (!Array.isArray(segmenti)) {
      return res.status(400).json({
        message: "Il body deve contenere un array 'segmenti'."
      });
    }

    const videoModificato = await Video.findByIdAndUpdate(
      req.params.id,
      { segmenti },
      { new: true, runValidators: true }
    );

    if (!videoModificato) {
      return res.status(404).json({ message: 'Video non trovato' });
    }

    res.json(videoModificato);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// DELETE: Elimina un video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videoEliminato = await Video.findByIdAndDelete(req.params.id);

    if (!videoEliminato) {
      return res.status(404).json({ message: 'Video non trovato' });
    }

    // Pubblica il messaggio su RabbitMQ
    try {
      await publishVideoDeleted(req.params.id);
    } catch (rabbitErr) {
      console.error(`[RABBITMQ] Errore nell'invio della notifica di cancellazione per il video ${req.params.id}:`, rabbitErr.message);
    }

    res.json({ message: 'Video eliminato con successo' });
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});

const PORTA = process.env.PORT || 5003;

app.listen(PORTA, () => {
  console.log(`Microservizio Catalogo in ascolto su porta ${PORTA}`);
});