# Mejenga

Organiza partidos de fútbol en Costa Rica: creá el partido, compartí el link
por WhatsApp y cobrá por SINPE Móvil. Los jugadores se inscriben desde su
teléfono (sin cuenta), suben la captura del pago y el administrador aprueba o
rechaza cada comprobante.

**Política de datos: un solo partido a la vez.** Al crear un partido nuevo se
eliminan los datos del anterior (inscripciones y capturas de pago). Lo único
que persiste es la información de los administradores.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Supabase](https://supabase.com): Postgres + RLS, Auth (código mágico por
  correo), Storage (capturas de pago)
- [Vercel](https://vercel.com) (runtime Node.js)
- Vitest para pruebas unitarias

## Roles

- **Administrador**: crea/edita/cancela partidos, comparte el link, revisa
  comprobantes (aprobar / rechazar / confirmar sin comprobante), invita a otros
  administradores. Acceso solo con código mágico; invitación por correo.
- **Jugador**: entra por el link `/m/[slug]`, se inscribe con nombre y teléfono,
  recibe su link secreto `/m/[slug]/p/[token]` donde paga y sube el comprobante.

## Puesta en marcha (local)

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
```

1. Creá un proyecto en [database.new](https://database.new).
2. En `.env.local` completá (Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor — nunca usar `NEXT_PUBLIC_`)
3. Base de datos:

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```

4. Configuración de Auth (dashboard de Supabase):
   - **Authentication → Sign In / Providers → Email → Allow new users to sign
     up**: OFF (soloadmins por invitación).
   - **Authentication → URL Configuration → Site URL**: `http://localhost:3000`
     (en producción: la URL de Vercel) y agregar
     `http://localhost:3000/auth/confirm` a **Redirect URLs**.
   - **Primer administrador**: Authentication → Users → Add user → tu correo.
5. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Comandos

```bash
make dev            # servidor de desarrollo
make build          # build de producción
make lint           # ESLint
make static-check   # TypeScript (tsc --noEmit)
make test           # Vitest (npm run test)
make complexity     # gate de complejidad ciclomática (max 10)
make security       # npm audit (falla si hay vulnerabilidades)
```

## Checklist E2E manual

1. Login con código mágico en `/auth/login`.
2. Crear partido en `/admin/matches/new` (fecha, hora, cancha, precio, SINPE).
3. Botón **Compartir por WhatsApp** (link `wa.me`) desde el detalle.
4. Abrir `/m/[slug]` en modo incógnito → inscribirse → redirige al link
   secreto del jugador.
5. Subir captura → estado pasa a *En revisión*.
6. En `/admin/matches/[id]`: aprobar/rechazar y ver el comprobante.
7. Crear otro partido → verificar que el anterior y sus capturas se borran.

## Despliegue (Vercel)

1. Subir el repo a GitHub y conectarlo en Vercel (o `vercel` CLI).
2. Variables de entorno en Vercel: las mismas de `.env.local` +
   `NEXT_PUBLIC_SITE_URL=https://<tu-dominio>` (opcional).
3. En Supabase: Site URL y Redirect URLs apuntando a Vercel
   (`https://<tu-dominio>/auth/confirm`).
4. Push a `main` → deploy automático.

## Privacidad (PII)

Nombres y teléfonos de los jugadores son datos personales: viven solo en
Supabase. Nunca se copian a servicios externos, prompts ni al repo. Las
capturas de pago se borran automáticamente al crear un partido nuevo.

## Estructura

```
app/
  admin/            # panel del administrador (protegido por proxy)
  m/[slug]/         # página pública de inscripción
  m/[slug]/p/[token]/  # página secreta del jugador (estado + upload)
  api/proof/        # subida de comprobantes (service role)
  auth/             # login con código mágico / confirmación
lib/
  actions/          # Server Actions (createMatch, joinMatch, review, invites)
  validation/       # zod schemas, teléfono CR, transiciones de estado (TDD)
  supabase/         # clientes SSR (client/server/proxy) + admin (service role)
supabase/migrations # esquema SQL + RLS + bucket payment-proofs
tests/              # Vitest unit tests
```
