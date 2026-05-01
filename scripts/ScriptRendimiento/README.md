# Test de Rendimiento — FarmaFinder

Script de prueba de carga desarrollado con [k6](https://k6.io/) para evaluar el rendimiento de la aplicación FarmaFinder bajo condiciones de estrés.

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

### Umbrales definidos

- `p(95) < 2000ms` — el 95% de las peticiones debe responder en menos de 2 segundos
- `rate < 5%` — la tasa de fallos debe ser inferior al 5%

## Resultados obtenidos

| Métrica                      | Valor       |
| ---------------------------- | ----------- |
| Total de peticiones          | 5037        |
| Peticiones por segundo       | 33.24 req/s |
| Tasa de fallos               | 0.00%       |
| Tiempo medio de respuesta    | 159.58ms    |
| Tiempo mínimo                | 36.91ms     |
| Tiempo máximo                | 1.5s        |
| p(90)                        | 391.93ms    |
| p(95)                        | 436.23ms    |
| Usuarios simultáneos máximos | 100         |
| Duración total               | 2m 31s      |
| Datos recibidos              | 192 MB      |

### Checks

| Check         | Resultado |
| ------------- | --------- |
| home 200      | ✅ 100%   |
| productos 200 | ✅ 100%   |
| register 200  | ✅ 100%   |

## Conclusiones

Bajo una carga de hasta 100 usuarios simultáneos, el sistema mantiene un tiempo de respuesta medio de **159ms** y un p95 de **436ms**, muy por debajo del umbral establecido de 2000ms. La tasa de fallos fue del **0%** en las 5037 peticiones realizadas, lo que demuestra que la infraestructura desplegada en Deno Deploy es estable y suficiente para el caso de uso previsto de la aplicación.
