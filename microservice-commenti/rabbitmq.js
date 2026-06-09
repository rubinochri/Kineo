const amqp = require('amqplib');
const Commento = require('./models/Commento');

const QUEUE_NAME = 'user-deleted-queue';

async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  let connection;
  let channel;
  const maxRetries = 15;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`[RABBITMQ] Tentativo di connessione a RabbitMQ (${retryCount + 1}/${maxRetries})...`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      console.log('[RABBITMQ] Connesso con successo a RabbitMQ!');
      break;
    } catch (err) {
      retryCount++;
      console.error(`[RABBITMQ] Errore connessione, nuovo tentativo tra 5 secondi: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  if (!connection || !channel) {
    console.error('[RABBITMQ] Errore critico: Impossibile stabilire una connessione stabile con RabbitMQ.');
    return;
  }

  // Gestione disconnessione / errori del canale
  connection.on('error', (err) => {
    console.error('[RABBITMQ] Connessione interrotta da un errore:', err);
  });
  connection.on('close', () => {
    console.error('[RABBITMQ] Connessione chiusa. Tentativo di riavvio in corso...');
    setTimeout(connectRabbitMQ, 5000);
  });

  // Assicura che la coda esista
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log(`[RABBITMQ] In ascolto sulla coda "${QUEUE_NAME}"...`);

  // Registrazione del consumer
  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      try {
        const content = msg.content.toString();
        console.log(`[RABBITMQ] Messaggio ricevuto su "${QUEUE_NAME}":`, content);

        let userId = null;

        // Tenta di fare il parsing del JSON
        try {
          const data = JSON.parse(content);
          userId = data.userId || data.id || data.utenteId;
        } catch (e) {
          // Se non è JSON valido, assume che il contenuto sia direttamente l'ID
          userId = content.trim();
        }

        if (userId) {
          console.log(`[RABBITMQ] Avvio cancellazione di massa per utenteId: ${userId}`);
          
          // Eventual Consistency: Elimina tutti i commenti (e risposte) inviati da questo utente
          const risultato = await Commento.deleteMany({ utenteId: userId });
          console.log(`[RABBITMQ] Cancellati ${risultato.deletedCount} commenti inviati dall'utente ${userId}.`);
        } else {
          console.warn('[RABBITMQ] Impossibile estrarre un userId valido dal messaggio.');
        }

        channel.ack(msg);
      } catch (err) {
        console.error('[RABBITMQ] Errore durante l\'elaborazione del messaggio:', err);
        // Esegui nack con requeue a false per evitare loop infiniti su errori applicativi persistenti
        channel.nack(msg, false, false);
      }
    }
  }, { noAck: false });
}

module.exports = { connectRabbitMQ };
