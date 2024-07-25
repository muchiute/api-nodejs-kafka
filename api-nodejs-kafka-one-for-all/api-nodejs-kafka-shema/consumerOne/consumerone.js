const { Kafka } = require('kafkajs');
const fs = require('fs');
const util = require('util');
const sleep = util.promisify(setTimeout);

const kafka = new Kafka({
  clientId: 'my-consumer',
  brokers: ['redpanda:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });

let lastMessageTime = Date.now();

// Função para salvar o offset em um arquivo
const saveOffset = (offset) => {
  fs.writeFileSync('offset.json', JSON.stringify({ offset: offset }), 'utf8');
};

// Função para carregar o offset do arquivo
const loadOffset = () => {
  if (fs.existsSync('offset.json')) {
    const data = fs.readFileSync('offset.json', 'utf8');
    return JSON.parse(data).offset;
  }
  return null;
};

const run = async () => {
  await consumer.connect();

  // Carrega o último offset salvo
  const lastOffset = loadOffset();
  await consumer.subscribe({ topic: 'my-topic', fromBeginning: lastOffset === null });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      lastMessageTime = Date.now(); // Atualiza o tempo da última mensagem recebida
      console.log({
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });
      // Salva o offset da mensagem atual
      saveOffset(message.offset);

      // Adiciona um delay de 2 segundos antes de processar a próxima mensagem
      await sleep(2000);
    },
  });

  // Verifica se há mensagens a cada 1 segundo
  setInterval(() => {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime >= 1000) {
      console.log('Não há novas mensagens na fila');
    }
  }, 1000);
};

run().catch(console.error);