// packages/database/connection.ts
import { Pool } from "postgres";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const DATABASE_URL = Deno.env.get("DATABASE_URL");
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL no está configurada en las variables de entorno");
    }
    pool = new Pool(DATABASE_URL, 10, true);

    // Mantener conexiones vivas cada minuto
    setInterval(async () => {
      try {
        const client = await pool!.connect();
        await client.queryObject("SELECT 1");
        client.release();
      } catch (_) {
        // ignorar errores de ping
      }
    }, 60_000);
  }
  return pool;
}

// Función helper para ejecutar queries con reconexión automática
export async function query<T>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const dbPool = getPool();
  let client;
  try {
    client = await dbPool.connect();
    const result = await client.queryObject<T>(text, params);
    return result.rows;
  } catch (err) {
    // Si falla por ConnectionError, reintenta una vez
    if (err instanceof Error && err.message.includes("ConnectionError")) {
      console.warn("La conexión falló. Reintentando...");
      if (client) client.release();
      client = await dbPool.connect();
      const result = await client.queryObject<T>(text, params);
      return result.rows;
    }
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Función para cerrar el pool
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
