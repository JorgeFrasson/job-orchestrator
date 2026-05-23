import 'reflect-metadata';
import { Client } from 'pg';
import { TopicProvisioningService } from './topic-provisioning.service';

function readEnvTopics() {
  return (process.env.KAFKA_BOOTSTRAP_JOB_TOPICS || '')
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function canReadJobsFromDatabase() {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_PORT &&
      process.env.DB_USER &&
      process.env.DB_NAME,
  );
}

async function loadPersistedJobTopics() {
  if (!canReadJobsFromDatabase()) {
    return [];
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  await client.connect();

  try {
    const result = await client.query<{ topic: string }>('select topic from jobs order by topic asc');
    return result.rows.map(({ topic }) => topic);
  } finally {
    await client.end();
  }
}

async function bootstrapKafka() {
  const topicProvisioning = new TopicProvisioningService();

  try {
    await topicProvisioning.ensureMainTopic();

    const [envTopics, persistedTopics] = await Promise.all([
      Promise.resolve(readEnvTopics()),
      loadPersistedJobTopics(),
    ]);

    const allTopics = Array.from(new Set([...persistedTopics, ...envTopics]));

    if (allTopics.length > 0) {
      await topicProvisioning.ensureJobTopicsForMany(allTopics);
    }

    console.log('[kafka:bootstrap] Main topic validated');
    console.log(`[kafka:bootstrap] Persisted job topics: ${persistedTopics.length}`);
    console.log(`[kafka:bootstrap] Extra job topics from env: ${envTopics.length}`);
    console.log(`[kafka:bootstrap] Total provisioned or validated job roots: ${allTopics.length}`);
  } finally {
    await topicProvisioning.onModuleDestroy();
  }
}

void bootstrapKafka().catch((error) => {
  console.error('[kafka:bootstrap] Failed:', error);
  process.exitCode = 1;
});
