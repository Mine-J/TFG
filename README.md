# FarmaFinder 💊
 
Aplicación web para localizar farmacias cercanas, consultar disponibilidad de medicamentos y gestionar pedidos online. Desarrollada como Trabajo de Fin de Grado.
 
🌐 **Demo en producción:** [https://tfg.mine-j.deno.net](https://tfg.mine-j.deno.net)
 
## ¿Qué es FarmaFinder?
 
FarmaFinder es una plataforma que conecta usuarios con farmacias cercanas para evitar desplazamientos innecesarios. El usuario puede solicitar medicamentos online y las farmacias de su zona reciben el pedido. Si una farmacia dispone de los medicamentos solicitados, acepta el pedido y el usuario puede ver en el mapa exactamente dónde está esa farmacia y cómo llegar, tanto a pie como en coche.
 
La aplicación tiene dos tipos de usuarios:
 
- **Usuario** — busca medicamentos, realiza pedidos y consulta el estado en tiempo real desde un mapa interactivo.
- **Farmacia** — recibe los pedidos de los usuarios de su zona, los acepta o rechaza según disponibilidad y gestiona su actividad desde un panel de control.
## Tecnologías
 
- **Frontend/Backend** — [Fresh 1.7](https://fresh.deno.dev/) (framework fullstack para Deno)
- **Runtime** — [Deno](https://deno.com/)
- **Base de datos** — PostgreSQL alojada en [Neon](https://neon.tech/)
- **Mapas** — [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- **Autenticación** — JWT con cookies HttpOnly
- **Deploy** — [Deno Deploy](https://deno.com/deploy)
## Estructura del proyecto
 
```
TFG/
├── apps/
│   └── web/                  # Aplicación Fresh (frontend + backend)
│       ├── routes/           # Páginas y endpoints API
│       ├── islands/          # Componentes interactivos (cliente)
│       ├── components/       # Componentes estáticos (servidor)
│       └── static/           # Archivos estáticos
├── packages/
│   ├── shared/               # Tipos y utilidades compartidas
│   └── database/             # Conexión a base de datos
└── scripts/
    └── ScriptRendimiento/    # Test de carga con k6
```
 
## Requisitos previos
 
- [Deno](https://deno.com/) v1.40 o superior
- Una base de datos PostgreSQL (se recomienda [Neon](https://neon.tech/) — plan gratuito suficiente)
- Cuenta en [Mapbox](https://www.mapbox.com/) para obtener un API key
- Cuenta en [Gmail](https://gmail.com/) para el envío de correos
## Variables de entorno
 
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
 
```env
DATABASE_URL=postgresql://usuario:password@host/dbname?sslmode=require
JWT_SECRET=tu_secreto_jwt
MAPBOX_API_KEY=pk.eyJ1...
GMAIL_USER=tucorreo@gmail.com
GMAIL_PASSWORD=tu_contraseña_de_aplicacion
API_KEY=tu_api_key
```
 
> **Nota:** Para `GMAIL_PASSWORD` usa una [contraseña de aplicación](https://support.google.com/accounts/answer/185833) de Google, no tu contraseña normal.
 
## Instalación y ejecución
 
### 1. Instalar Deno
 
```bash
curl -fsSL https://deno.land/install.sh | sh
```
 
### 2. Clonar el repositorio
 
```bash
git clone https://github.com/Mine-J/TFG.git
cd TFG
```
 
### 3. Configurar variables de entorno
 
```bash
cp .env.example .env
# Edita el archivo .env con tus valores
```
 
### 4. Arrancar en modo desarrollo
 
```bash
deno task dev
```
 
La aplicación estará disponible en [http://localhost:8000](http://localhost:8000).
 
### 5. Build para producción
 
```bash
deno task build
deno task preview
```
 
## Deploy en Deno Deploy
 
1. Crea un proyecto en [Deno Deploy](https://dash.deno.com/)
2. Conecta el repositorio de GitHub
3. Configura en **Settings → App Configuration**:
   - **Root Directory:** `apps/web`
   - **Build Command:** `deno task build`
   - **Entry Point:** `main.ts`
4. Añade las variables de entorno en **Settings → Environment Variables**
5. Despliega
## Test de rendimiento
 
Consulta [`scripts/ScriptRendimiento/README.md`](./scripts/ScriptRendimiento/README.md) para ejecutar el test de carga con k6.
 
### Resultados obtenidos
 
| Métrica | Valor |
|---------|-------|
| Usuarios simultáneos | 100 |
| Tasa de fallos | 0% |
| Tiempo medio de respuesta | 159ms |
| p(95) | 436ms |
 
## Funcionalidades principales
 
- Registro e inicio de sesión para usuarios y farmacias
- Mapa interactivo con localización de farmacias cercanas
- Búsqueda y consulta de medicamentos
- Gestión de pedidos (crear, aceptar, cancelar)
- Panel de control para farmacias
- Notificaciones por correo electrónico
- Cálculo de rutas a pie y en coche hasta la farmacia
## Licencia
 
Proyecto académico — Trabajo de Fin de Grado.