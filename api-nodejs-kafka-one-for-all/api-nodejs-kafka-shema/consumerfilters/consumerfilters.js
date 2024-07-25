// # dentro da pasta instale os pacotes
// package-lock.json com comando
// npm install kafkajs avsc express fs path uuid

//consumer/consumer.js
const { Kafka } = require('kafkajs');
const avro = require('avsc');
const fs = require('fs');
const path = require('path');

const app = require('express')();
app.use(require('express').json());

const kafka = new Kafka({
  clientId: 'my-consumer',
  brokers: ['redpanda:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });
const schemaPath = path.join(__dirname, 'schema.avsc');
const schema = avro.Type.forSchema(JSON.parse(fs.readFileSync(schemaPath, 'utf-8')));

let lastMessageTime = Date.now();
let messages = [];

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      lastMessageTime = Date.now();

      try {
        const decodedMessage = schema.fromBuffer(message.value);
        messages.push({
          partition,
          offset: message.offset,
          key: decodedMessage.key,
          value: decodedMessage.value,
          timestamp: new Date().toISOString(),
          phrase: 'mensagem recebida'
        });

        console.log({
          partition,
          offset: message.offset,
          key: decodedMessage.key,
          value: decodedMessage.value,
          timestamp: new Date().toISOString(),
          phrase: 'mensagem enviada'
        });
      } catch (error) {
        console.error('Erro ao decodificar mensagem:', error);
        console.error('Mensagem com erro:', message.value.toString());
      }
    }
  });

  setInterval(() => {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime >= 5000) {
      console.log('Não há novas mensagens na fila');
    }
  }, 5000); // consumido por 5 segundos
};

runConsumer().catch(console.error);

app.get('/messages', (req, res) => {
  const { date, start, end, offset, offset_start, offset_end, timestamp_start, timestamp_end } = req.query;
  let filteredMessages = messages;
  if (date) {
    const queryDate = new Date(date);
    filteredMessages = filteredMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      return msgDate.toDateString() === queryDate.toDateString();
    });
  }

  if (start) {
    const startDate = new Date(start);
    filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) >= startDate);
  }

  if (end) {
    const endDate = new Date(end);
    filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) <= endDate);
  }

  if (offset) {
    filteredMessages = filteredMessages.filter(msg => msg.offset === offset);
  }

  if (offset_start) {
    filteredMessages = filteredMessages.filter(msg => parseInt(msg.offset) >= parseInt(offset_start));
  }

  if (offset_end) {
    filteredMessages = filteredMessages.filter(msg => parseInt(msg.offset) <= parseInt(offset_end));
  }

  if (timestamp_start) {
    const startTime = new Date(timestamp_start);
    filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) >= startTime);
  }

  if (timestamp_end) {
    const endTime = new Date(timestamp_end);
    filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) <= endTime);
  }

  res.json(filteredMessages);
});

app.listen(3002, () => console.log('Consumer API running on port 3002'));
