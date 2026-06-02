# Test de Rendimiento — FarmaFinder

Script de prueba de carga desarrollado con [k6](https://k6.io/) para evaluar el rendimiento de la aplicación FarmaFinder bajo condiciones de estrés.

## Alcance actual y justificacion

El resultado historico de este test se obtuvo solo con endpoints publicos para tener una baseline simple y repetible sin depender de credenciales ni del estado de datos.

Esa baseline es util, pero parcial: no refleja la carga real de rutas autenticadas que consultan y actualizan base de datos.

## Dependencias

- [k6](https://k6.io/) — herramienta de pruebas de carga

### Instalación de k6 en Ubuntu/Debian

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Ejecución

```bash
cd scripts/ScriptRendimiento
k6 run script.js
```

### Activar rutas autenticadas (opcional)

Si se definen credenciales por variables de entorno, el mismo script ejecuta tambien rutas criticas autenticadas:

```bash
K6_USER_EMAIL="usuario@dominio.com" \
K6_USER_PASSWORD="tu_password" \
K6_FARMACIA_NIF="12345678A" \
K6_FARMACIA_PASSWORD="tu_password" \
k6 run script.js
```

## Descripción del test

El script simula una carga progresiva de usuarios concurrentes sobre los endpoints públicos de la aplicación:

| Fase            | Duración | Usuarios |
| --------------- | -------- | -------- |
| Rampa de subida | 30s      | 0 → 10   |
| Carga media     | 1m       | 10 → 50  |
| Carga máxima    | 30s      | 50 → 100 |
| Rampa de bajada | 30s      | 100 → 0  |

### Endpoints testeados

- `GET /` — página principal
- `GET /productos` — listado de productos
- `GET /auth/register` — página de registro

Adicionalmente, si hay credenciales:

- Usuario autenticado: `GET /api/producto/productosCesta`, `GET /api/pedidos/obtenerPedidos`, `GET /cesta`, `GET /pedidos`
- Farmacia autenticada: `GET /farmacia/solicitudes`, `GET /api/farmacia/solicitudesFarmacia/pedidos?tipo=Pendiente`, `GET /api/farmacia/solicitudesFarmacia/SEE`

## Escenarios criticos documentados (no automatizados en este script base)

Para cerrar la cobertura funcional de rendimiento, se documentan estos escenarios para ejecucion en entorno de pruebas controlado:

- Cesta (escritura BD): `POST /api/cesta/añadir`, `POST /api/cesta/actualizarCantidad`
- Mis pedidos (escritura BD): `POST /api/cesta/realizarPedido`, `POST /api/pedidos/cancelar`
- Panel farmacia (acciones sobre solicitudes): `POST /api/farmacia/solicitudesFarmacia/aceptar`, `POST /api/farmacia/solicitudesFarmacia/rechazar`, `POST /api/farmacia/solicitudesFarmacia/finalizar`
- SSE farmacia: mantener conexiones concurrentes sobre `GET /api/farmacia/solicitudesFarmacia/SEE`

Nota: estas operaciones modifican estado en base de datos y por eso se separan de la baseline publica.

### Umbrales definidos

- `p(95) < 2000ms` — el 95% de las peticiones debe responder en menos de 2 segundos
- `rate < 5%` — la tasa de fallos debe ser inferior al 5%

## Resultados obtenidos

Estos resultados corresponden a la ejecución larga completa (stages hasta 100 VUs, ~2m30s). Resumen de métricas observadas:

|                      Métrica |              Valor |
| ---------------------------: | -----------------: |
|          Total de peticiones |             11,085 |
| Peticiones por segundo (avg) |        71.90 req/s |
|          Peticiones fallidas | 0 / 11,085 (0.00%) |
|    Tiempo medio de respuesta |          217.37 ms |
|                Tiempo mínimo |           36.77 ms |
|                Tiempo máximo |             3.14 s |
|                        p(90) |          561.98 ms |
|                        p(95) |          861.19 ms |
|                  Iteraciones |                739 |
|               Duración total |             ~2m30s |
|       VUs máximos observados |                100 |
|              Datos recibidos |      115 MB 748 kB |
|               Checks totales | 8,129 (100% éxito) |
|     Iteration duration (avg) |             8.27 s |

### Checks (ejemplos reportados)

- `home 200` — ✅
- `productos 200` — ✅
- `register 200` — ✅
- `login usuario 200` — ✅
- `api productosCesta 200` — ✅
- `api obtenerPedidos 200` — ✅
- `page cesta 200` — ✅
- `page pedidos 200` — ✅
- `login farmacia 200` — ✅
- `panel solicitudes 200` — ✅
- `api pedidos farmacia 200` — ✅

## Conclusiones

Durante la ejecución larga (stages hasta 100 VUs, ~2m30s) el sistema procesó 11,085 peticiones con **0% de fallos** y un p95 de **861 ms**, cumpliendo el umbral definido (`p(95) < 2000 ms`). Las rutas autenticadas incluidas en el script (login usuario/farmacia, consultas de cesta y pedidos, panel de farmacia) respondieron correctamente según los checks.

