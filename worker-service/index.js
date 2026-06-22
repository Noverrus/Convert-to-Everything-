import express from 'express';
import { createClient } from '@supabase/supabase-js';
import processJob from './converter.js';

const app = express();
app.use(express.json());

// Enterprise Note: Initialize with the Service Role Key since this is a trusted, secure backend environment.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Webhook payload receiver specifically targeted for Supabase Database Triggers
app.post('/webhook/supabase', async (req, res) => {
  try {
    const record = req.body.record;

    if (!record || record.status !== 'pending') {
      return res.status(200).send('Ignored: Job active or null.');
    }

    // Acknowledge webhook immediately to prevent platform timeout retries
    res.status(200).send('Processing Initiated');

    // 1. Transactional check marking job state to active
    await supabase
      .from('conversions')
      .update({ status: 'processing' })
      .eq('id', record.id);

    // 2. Perform extreme heavy lifting isolated from the Vercel edge
    const resultUrl = await processJob(record.original_url, record.target_format, supabase);

    // 3. Complete remote table data point allowing Realtime UX to resolve
    await supabase
      .from('conversions')
      .update({ status: 'completed', converted_url: resultUrl })
      .eq('id', record.id);

  } catch (error) {
    console.error('Worker Processing Fault Isolation:', error);
    if (req.body?.record?.id) {
       await supabase.from('conversions').update({ status: 'error' }).eq('id', req.body.record.id);
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Node.js Offloaded Conversion Server listening reliably on port ${PORT}`);
});
