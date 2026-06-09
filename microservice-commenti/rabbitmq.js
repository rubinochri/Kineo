const amqp = require('amqplib');
const Commento = require('./models/Commento');

const USER_EXCHANGE = 'user-events-exchange';
const USER_QUEUE = 'user-deleted-commenti-queue';

const VIDEO_EXCHANGE = 'video-events-exchange';
const VIDEO_QUEUE = 'video-deleted-commenti-queue';

async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  let connection;
  let channel;
  const maxRetries = 15;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`[RABBITMQ-COMMENTI] Tentativo di connessione a RabbitMQ (${retryCount + 1}/${maxRetries})...`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      console.log('[RABBITMQ-COMMENTI] Connesso con successo a RabbitMQ!');
      break;
    } catch (err) {
      retryCount++;
      console.error(`[RABBITMQ-COMMENTI] Errore connessione, nuovo tentativo tra 5 secondi: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  if (!connection || !channel) {
    console.error('[RABBITMQ-COMMENTI] Errore critico: Impossibile stabilire una connessione stabile con RabbitMQ.');
    return;
  }

  // Gestione disconnessione / errori del canale
  connection.on('error', (err) => {
    console.error('[RABBITMQ-COMMENTI] Connessione interrotta da un errore:', err);
  });
  connection.on('close', () => {
    console.error('[RABBITMQ-COMMENTI] Connessione chiusa. Tentativo di riavvio in corso...');
    setTimeout(connectRabbitMQ, 5000);
  });

  try {
    // ----------------------------------------------------
    // 1. Configurazione Canale e Code per USER DELETED
    // ----------------------------------------------------
    await channel.assertExchange(USER_EXCHANGE, 'fanout', { durable: true });
    await channel.assertQueue(USER_QUEUE, { durable: true });
    await channel.bindQueue(USER_QUEUE, USER_EXCHANGE, '');
    console.log(`[RABBITMQ-COMMENTI] Coda "${USER_QUEUE}" legata all'exchange "${USER_EXCHANGE}"`);

    // Consumer per la cancellazione dell'utente
    channel.consume(USER_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const content = msg.content.toString();
          console.log(`[RABBITMQ-COMMENTI] Messaggio ricevuto su "${USER_QUEUE}":`, content);

          let userId = null;
          try {
            const data = JSON.parse(content);
            userId = data.userId || data.id || data.utenteId;
          } catch (e) {
            userId = content.trim();
          }

          if (userId) {
            console.log(`[RABBITMQ-COMMENTI] Avvio cancellazione di massa commenti per utenteId: ${userId}`);
            const risultato = await Commento.deleteMany({ utenteId: userId });
            console.log(`[RABBITMQ-COMMENTI] Cancellati ${risultato.deletedCount} commenti inviati dall'utente ${userId}.`);
          } else {
            console.warn('[RABBITMQ-COMMENTI] Impossibile estrarre un userId valido dal messaggio.');
          }

          channel.ack(msg);
        } catch (err) {
          console.error('[RABBITMQ-COMMENTI] Errore durante l\'elaborazione del messaggio di cancellazione utente:', err);
          channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

    // ----------------------------------------------------
    // 2. Configurazione Canale e Code per VIDEO DELETED
    // ----------------------------------------------------
    await channel.assertExchange(VIDEO_EXCHANGE, 'fanout', { durable: true });
    await channel.assertQueue(VIDEO_QUEUE, { durable: true });
    await channel.bindQueue(VIDEO_QUEUE, VIDEO_EXCHANGE, '');
    console.log(`[RABBITMQ-COMMENTI] Coda "${VIDEO_QUEUE}" legata all'exchange "${VIDEO_EXCHANGE}"`);

    // Consumer per la cancellazione del video
    channel.consume(VIDEO_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const content = msg.content.toString();
          console.log(`[RABBITMQ-COMMENTI] Messaggio ricevuto su "${VIDEO_QUEUE}":`, content);

          let videoId = null;
          try {
            const data = JSON.parse(content);
            videoId = data.videoId || data.id;
          } catch (e) {
            videoId = content.trim();
          }

          if (videoId) {
            console.log(`[RABBITMQ-COMMENTI] Avvio cancellazione di massa commenti per videoId: ${videoId}`);
            const risultato = await Commento.deleteMany({ videoId: videoId });
            console.log(`[RABBITMQ-COMMENTI] Cancellati ${risultato.deletedCount} commenti collegati al video ${videoId}.`);
          } else {
            console.warn('[RABBITMQ-COMMENTI] Impossibile estrarre un videoId valido dal messaggio.');
          }

          channel.ack(msg);
        } catch (err) {
          console.error('[RABBITMQ-COMMENTI] Errore durante l\'elaborazione del messaggio di cancellazione video:', err);
          channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

  } catch (err) {
    console.error('[RABBITMQ-COMMENTI] Errore durante l\'asserzione o il binding delle code:', err);
  }
}

module.exports = { connectRabbitMQ };
