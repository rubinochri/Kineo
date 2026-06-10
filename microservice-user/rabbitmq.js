const amqp = require('amqplib');

const EXCHANGE_NAME = 'user-events-exchange';
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
      channel = await connection.createConfirmChannel();
      console.log('[RABBITMQ-PUBLISHER] Connesso con successo a RabbitMQ (Confirm Channel)!');
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
    // Assicura che l'exchange esista
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
    console.log(`[RABBITMQ-PUBLISHER] Exchange "${EXCHANGE_NAME}" asserito con successo.`);
  } catch (err) {
    console.error(`[RABBITMQ-PUBLISHER] Errore nell'asserzione dell'exchange "${EXCHANGE_NAME}":`, err);
  }
}

async function publishUserDeleted(userId) {
  if (!channel) {
    console.error(`[RABBITMQ-PUBLISHER] Impossibile pubblicare: canale non pronto per la cancellazione di ${userId}`);
    throw new Error('Canale RabbitMQ non pronto');
  }

  try {
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
    
    const payload = JSON.stringify({ userId: userId });
    
    await new Promise((resolve, reject) => {
      channel.publish(EXCHANGE_NAME, '', Buffer.from(payload), { persistent: true }, (err, ok) => {
        if (err) {
          console.error('[RABBITMQ-PUBLISHER] NACK ricevuto dal broker o errore di pubblicazione:', err);
          reject(err);
        } else {
          console.log(`[RABBITMQ-PUBLISHER] ACK ricevuto! Messaggio confermato su exchange "${EXCHANGE_NAME}":`, payload);
          resolve(ok);
        }
      });
    });
  } catch (err) {
    console.error('[RABBITMQ-PUBLISHER] Errore nell\'invio del messaggio su exchange:', err);
    throw err;
  }
}

module.exports = {
  connectRabbitMQ,
  publishUserDeleted
};
