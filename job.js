const cron = require('node-cron');
const pool = require('./pg');

cron.schedule('*/1 * * * *', async() => {
    updatePeople();
});

async function updatePeople() {
    const client = await pool().connect();
    await client.query('update visits set viewing_currently=false');

    client.release();
}