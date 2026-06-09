const amqp = require('amqplib');

const QUEUE_NAME = 'user-deleted-queue';
let channel = null;
let connection = null;

async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const maxRetries = 15;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`[RABBITMQ-PUBLISHER] Tentativo di connessione a RabbitMQ (${retryCount + 1}/${maxRetries})...`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      console.log('[RABBITMQ-PUBLISHER] Connesso con successo a RabbitMQ!');
      break;
    } catch (err) {
      retryCount++;
      console.error(`[RABBITMQ-PUBLISHER] Errore connessione, nuovo tentativo tra 5 secondi: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  if (!connection || !channel) {
    console.error('[RABBITMQ-PUBLISHER] Errore critico: Impossibile stabilire una connessione stabile con RabbitMQ.');
    return;
  }

  // Gestione disconnessione / errori del canale
  connection.on('error', (err) => {
    console.error('[RABBITMQ-PUBLISHER] Connessione interrotta da un errore:', err);
  });
  connection.on('close', () => {
    console.error('[RABBITMQ-PUBLISHER] Connessione chiusa. Tentativo di riavvio in corso...');
    channel = null;
    connection = null;
    setTimeout(connectRabbitMQ, 5000);
  });

  try {
    // Assicura che la coda esista
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[RABBITMQ-PUBLISHER] Coda "${QUEUE_NAME}" asserita con successo.`);
  } catch (err) {
    console.error(`[RABBITMQ-PUBLISHER] Errore nell'asserzione della coda "${QUEUE_NAME}":`, err);
  }
}

async function publishUserDeleted(userId) {
  if (!channel) {
    console.error(`[RABBITMQ-PUBLISHER] Impossibile pubblicare: canale non pronto per la cancellazione di ${userId}`);
    throw new Error('Canale RabbitMQ non pronto');
  }

  try {
    // Assicura che la coda venga dichiarata/asserita prima dell'invio del messaggio per evitare che il pacchetto vada perso
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    const payload = JSON.stringify({ userId: userId });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(payload), { persistent: true });
    console.log(`[RABBITMQ-PUBLISHER] Messaggio inviato con successo su "${QUEUE_NAME}":`, payload);
  } catch (err) {
    console.error('[RABBITMQ-PUBLISHER] Errore nell\'invio del messaggio a RabbitMQ:', err);
    throw err;
  }
}

module.exports = {
  connectRabbitMQ,
  publishUserDeleted
};
