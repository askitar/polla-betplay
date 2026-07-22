# La Polla BetPlay

Polla de predicciones de la Liga BetPlay Dimayor para clubes privados (amigos,
oficina). Next.js 16 (App Router) + Prisma + PostgreSQL, login por enlace
mágico, sincronización automática de resultados vía API-Football.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind v4
- **PostgreSQL** vía Prisma 7 (dev local con `prisma dev`, producción con Neon)
- **Auth.js v5** (enlace mágico por correo, sin contraseñas) + Resend
- **API-Football** (api-sports.io) para calendario/resultados de la Liga BetPlay
- **Upstash QStash** como reloj externo (Vercel Hobby solo permite cron 1x/día)
- **Vercel** para el despliegue

## Variables de entorno

Copia `.env` (ya tiene los nombres correctos) y llena cada una:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | En local: `npx prisma dev` te la da. En producción: conexión de Neon (crear vía integración de Vercel → Storage → Neon, o directo en neon.tech) |
| `AUTH_SECRET` | Generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `RESEND_API_KEY` | resend.com → cuenta gratis → API Keys → Create API Key |
| `EMAIL_FROM` | Mientras no tengas dominio propio verificado en Resend, usa `onboarding@resend.dev` (solo entrega a la cuenta con la que te registraste en Resend). Con dominio propio verificado, cambia a algo como `La Polla BetPlay <noreply@tudominio.com>` |
| `API_FOOTBALL_KEY` | dashboard.api-football.com/register → cuenta gratis (100 solicitudes/día) → copiar "API-KEY" |
| `API_FOOTBALL_LEAGUE_ID` / `API_FOOTBALL_SEASON_YEAR` | Correr `npx tsx scripts/find-league.ts` (con la key ya puesta) y buscar "Liga BetPlay" / "Primera A" en el resultado — **no asumir el ID a ciegas, confirmarlo con la llamada real** |
| `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` | console.upstash.com → QStash → Signing Keys |
| `CRON_SHARED_SECRET` | Cualquier string largo tuyo; solo se usa como respaldo local mientras QStash no esté configurado |

## Desarrollo local

```bash
npx prisma dev              # levanta Postgres local (déjalo corriendo aparte)
npm run dev                 # levanta Next.js en localhost:3000
```

Scripts útiles en `scripts/`:
- `seed.ts`: carga los 20 equipos de la Liga BetPlay y el calendario real de la
  Fecha 1 (2026-II), confirmado con prensa deportiva. Borra los partidos
  existentes antes de sembrar, así que no lo corras contra datos que ya
  tengan predicciones reales que quieras conservar.
- `find-league.ts`: consulta real a API-Football para confirmar el ID de la liga colombiana.
- `dev-login.ts <correo> <nombre>`: crea un usuario + sesión de prueba directo en la base de datos (para probar sin depender de un correo real). Imprime el `sessionToken`; pégalo como cookie `authjs.session-token` en el navegador para entrar como ese usuario.

## Sincronización automática de resultados: decisión tomada

Se confirmó con una llamada real que **API-Football (plan Free) no da acceso a
la temporada en curso** (solo temporadas 2022-2024; el mensaje exacto es
*"Free plans do not have access to this season, try from 2022 to 2024"*).
Pasar a Pro cuesta $19 USD/mes. Decisión: **no se paga por ahora**, la app
funciona 100% con carga manual del admin (ya construida y probada). Todo el
código de sincronización automática (`lib/api-football.ts`,
`app/api/cron/sync-matches/route.ts`) queda listo y documentado por si más
adelante se decide pagar el plan Pro; en ese caso solo hay que confirmar que
la llamada real trae datos (con `scripts/test-sync.ts`) y programar el
schedule en QStash (ver más abajo).

## Decisiones de arquitectura (para no repetir la discusión)

- **Partidos, jornadas, equipos y resultados son globales**, compartidos por
  todos los clubes (una sola Liga BetPlay real). Los clubes solo son
  membresía + código de invitación. Un admin de **cualquier** club puede
  corregir un resultado manualmente y eso corrige la tabla de todos los
  clubes (es un dato público del fútbol real, no algo privado de un club).
- **Una predicción por usuario por partido**, válida en todos los clubes a
  los que pertenezca (no se repite la predicción por club).
- Un resultado marcado `resultSource: MANUAL` queda congelado: la
  sincronización automática nunca lo vuelve a sobrescribir.
- El cierre de predicciones (10 min antes del pitazo) y el revelado de
  predicciones ajenas (al arrancar el partido) se calculan **siempre en el
  servidor** contra la hora del servidor, nunca confiando en el reloj del
  cliente.

## Pendiente antes de producción

1. Correr `npx prisma migrate dev --name init` contra la base de datos real
   de Neon para tener historial de migraciones (en local se usó `db push`
   porque el Postgres local de `prisma dev` no deja crear la shadow database
   que `migrate dev` necesita).
2. Confirmar `API_FOOTBALL_LEAGUE_ID`/`API_FOOTBALL_SEASON_YEAR` con
   `find-league.ts` y correr una sincronización real de prueba pegándole a
   `/api/cron/sync-matches` con el header `x-cron-secret`.
3. En Upstash QStash, crear un schedule (cada 5-15 min) apuntando a
   `https://tudominio.com/api/cron/sync-matches` con el método POST. Una vez
   configurado, las signing keys activan la verificación de firma real y el
   `CRON_SHARED_SECRET` deja de usarse.
4. Si vas a mandar correos a personas fuera de tu propia cuenta de Resend,
   verificar un dominio propio en Resend (si no, solo te llegan a ti mismo).
5. Nota de matching: la sincronización enlaza equipos por nombre exacto la
   primera vez (`Team.name`). Si la API trae un nombre con acentos o
   abreviaturas distintas a los que sembramos (`prisma/seed.ts`), puede crear
   un equipo duplicado — revisar la tabla `Team` tras la primera
   sincronización real.

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Importa el proyecto en Vercel.
3. Conecta Neon desde Storage → Neon (o pega tu propio `DATABASE_URL`/`DIRECT_URL`).
4. Agrega todas las variables de entorno de la tabla de arriba en Vercel → Settings → Environment Variables.
5. Deploy. Conecta tu dominio propio en Settings → Domains cuando lo tengas.
