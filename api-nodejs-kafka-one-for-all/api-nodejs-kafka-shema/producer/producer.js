// # dentro da pasta instale os pacotes
// package-lock.json com comando
// npm install kafkajs avsc express fs path uuid

// producer/producer.js
const { Kafka } = require('kafkajs');
const avro = require('avsc');
const fs = require('fs');

const kafka = new Kafka({
  clientId: 'my-producer',
  brokers: ['redpanda:9092']
});

const producer = kafka.producer();
const schema = avro.Type.forSchema(JSON.parse(fs.readFileSync('./schema.avsc', 'utf-8')));

const run = async () => {
  await producer.connect();

  setInterval(async () => {
    try {
      const key = Math.random().toString(36).substring(7);
      const value = Math.floor(Math.random() * 10);
      const message = { key, value };

      const serializedMessage = schema.toBuffer(message);

      await producer.send({
        topic: 'my-topic',
        messages: [
          { value: serializedMessage },
        ],
      });

      console.log('Mensagem enviada:', message);

    } catch (err) {
      console.error('Erro ao enviar mensagem', err);
    }

  }, 1000); // Intervalo de 1 segundos
};

run().catch(console.error);
