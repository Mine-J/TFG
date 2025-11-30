// packages/database/connection.ts
import { Pool } from "postgres";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL no está configurada en las variables de entorno");
}

// Crear pool de conexiones
export const pool = new Pool(DATABASE_URL, 10);

// Función helper para ejecutar queries
export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Función para cerrar el pool
export async function closePool(): Promise<void> {
  await pool.end();
}