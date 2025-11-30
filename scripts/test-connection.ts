import "$std/dotenv/load.ts";
import { query } from "@db/connection.ts";

console.log("🔄 Probando conexión a la base de datos...");

try {
  const result = await query<{ now: Date }>("SELECT NOW() as now");
  console.log("✅ Conexión exitosa!");
  console.log("   Hora del servidor:", result[0].now);
} catch (error) {
  console.error("❌ Error de conexión:", error);
}

Deno.exit(0);
