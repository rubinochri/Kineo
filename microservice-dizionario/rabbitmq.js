const amqp = require('amqplib');
const SavedWord = require('./models/SavedWord');

const EXCHANGE_NAME = 'user-events-exchange';
const QUEUE_NAME = 'user-deleted-dizionario-queue';

async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  let connection;
  let channel;
  const maxRetries = 15;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`[RABBITMQ-DIZIONARIO] Tentativo di connessione a RabbitMQ (${retryCount + 1}/${maxRetries})...`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      console.log('[RABBITMQ-DIZIONARIO] Connesso con successo a RabbitMQ!');
      break;
    } catch (err) {
      retryCount++;
      console.error(`[RABBITMQ-DIZIONARIO] Errore connessione, nuovo tentativo tra 5 secondi: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  if (!connection || !channel) {
    console.error('[RABBITMQ-DIZIONARIO] Errore critico: Impossibile stabilire una connessione stabile con RabbitMQ.');
    return;
  }

  // Gestione disconnessione / errori del canale
  connection.on('error', (err) => {
    console.error('[RABBITMQ-DIZIONARIO] Connessione interrotta da un errore:', err);
  });
  connection.on('close', () => {
    console.error('[RABBITMQ-DIZIONARIO] Connessione chiusa. Tentativo di riavvio in corso...');
    setTimeout(connectRabbitMQ, 5000);
  });

  try {
    // Configurazione exchange e coda per la cancellazione dell'utente
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '');
    console.log(`[RABBITMQ-DIZIONARIO] Coda "${QUEUE_NAME}" collegata all'exchange "${EXCHANGE_NAME}"`);

    // Consumer
    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const content = msg.content.toString();
          console.log(`[RABBITMQ-DIZIONARIO] Messaggio ricevuto su "${QUEUE_NAME}":`, content);

          let userId = null;
          try {
            const data = JSON.parse(content);
            userId = data.userId || data.id || data.utenteId;
          } catch (e) {
            userId = content.trim();
          }

          if (userId) {
            console.log(`[RABBITMQ-DIZIONARIO] Avvio cancellazione di massa parole salvate per utenteId: ${userId}`);
            const risultato = await SavedWord.deleteMany({ userId: userId });
            console.log(`[RABBITMQ-DIZIONARIO] Cancellate ${risultato.deletedCount} parole salvate per l'utente ${userId}.`);
          } else {
            console.warn('[RABBITMQ-DIZIONARIO] Impossibile estrarre un userId valido dal messaggio.');
          }

          channel.ack(msg);
        } catch (err) {
          console.error('[RABBITMQ-DIZIONARIO] Errore durante l\'elaborazione del messaggio:', err);
          channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

  } catch (err) {
    console.error('[RABBITMQ-DIZIONARIO] Errore durante l\'asserzione o il binding delle code:', err);
  }
}

module.exports = { connectRabbitMQ };
