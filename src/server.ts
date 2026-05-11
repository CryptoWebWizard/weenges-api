import app from './app';
import pool from './config/database';
import logger from './utils/logger';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

const startServer = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected successfully');

    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
    });

    const shutdown = (signal: string): void => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await pool.end();
        logger.info('PostgreSQL pool closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to connect to PostgreSQL', { error: err });
    process.exit(1);
  }
};

startServer();
