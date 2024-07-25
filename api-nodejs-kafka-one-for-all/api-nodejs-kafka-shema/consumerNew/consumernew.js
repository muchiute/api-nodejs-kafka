const { Kafka } = require('kafkajs');
const util = require('util');
const sleep = util.promisify(setTimeout);

const kafka = new Kafka({
  clientId: 'my-consumer',
  brokers: ['redpanda:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });

let lastMessageTime = Date.now();

const getLastOffset = async (topic) => {
  const admin = kafka.admin();
  await admin.connect();
  const offsets = await admin.fetchTopicOffsets(topic);
  await admin.disconnect();
  
  const endOffsets = offsets.map(({ partition, offset }) => ({
    partition,
    offset: parseInt(offset)
  }));

  return Math.max(...endOffsets.map(({ offset }) => offset));
};

const run = async () => {
  await consumer.connect();
  
  const lastOffset = await getLastOffset('my-topic');
  console.log(`Offset: ${lastOffset}`);

  await consumer.subscribe({ topic: 'my-topic', fromBeginning: false });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (parseInt(message.offset) < lastOffset) {
        return;
      }

      lastMessageTime = Date.now(); // Atualiza o tempo da última mensagem recebida
      console.log({
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });

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