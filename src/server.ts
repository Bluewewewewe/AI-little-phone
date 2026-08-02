import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = '0.0.0.0'; // 绑定所有网络接口，允许外部访问
const port = parseInt(process.env.PORT || '5000', 10);

console.log('=== Server Configuration ===');
console.log(`Environment: ${dev ? 'development' : 'production'}`);
console.log(`Hostname: ${hostname}`);
console.log(`Port: ${port}`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'configured' : 'not set'}`);
console.log(`SUPABASE_SECRET_KEY: ${process.env.SUPABASE_SECRET_KEY ? 'configured' : 'not set'}`);
console.log('===========================');

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  
  server.once('error', err => {
    console.error('Server error:', err);
    process.exit(1);
  });
  
  server.listen(port, hostname, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV || 'production'
      }`,
    );
  });
}).catch(err => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});
