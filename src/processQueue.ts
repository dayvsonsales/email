import 'dotenv/config';

import Queue from './queue/Queue';

console.log(`Queue initialized`);

Queue.processQueue();
