import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const hostname = '0.0.0.0'; // 绑定所有网络接口，允许外部访问

// 安全解析端口，确保不会出现 NaN
const parsedPort = parseInt(process.env.PORT || '5000', 10);
const port = Number.isNaN(parsedPort) ? 5000 : parsedPort;

// 检测是否为生产环境
const isProduction = process.env.NODE_ENV === 'production' || process.env.COZE_PROJECT_ENV === 'PROD';
const dev = !isProduction;

console.log('=== Server Configuration ===');
console.log(`Environment: ${dev ? 'development' : 'production'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`COZE_PROJECT_ENV: ${process.env.COZE_PROJECT_ENV || 'not set'}`);
console.log(`Hostname: ${hostname}`);
console.log(`Port: ${port} (type: ${typeof port}, raw: ${process.env.PORT || 'not set'})`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'configured' : 'not set'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not set'}`);
console.log(`SUPABASE_SECRET_KEY (fallback): ${process.env.SUPABASE_SECRET_KEY ? 'configured' : 'not set'}`);
console.log(`Current directory: ${process.cwd()}`);
console.log('===========================');

// Create Next.js app - 在生产环境中明确指定 dir 参数
const app = next({ 
  dev, 
  hostname, 
  port,
  dir: './', // 明确指定项目根目录
});
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
