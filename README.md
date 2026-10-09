# Tu Sublimación Creativa

Tienda inicial de productos de sublimación hecha con Next.js, Supabase y preparada para publicar en Vercel. La primera versión recibe consultas y pedidos por WhatsApp; no procesa pagos online.

## Requisitos
- Node.js 20.9 o superior
- Cuenta de Supabase
- Cuenta de Vercel (cuando quieras publicar)
- Número de WhatsApp del negocio con código de país, solo números. Argentina suele usar el formato `549` + código de área + número.

## 1. Instalar y ejecutar
```bash
npm install
cp .env.example .env.local
npm run dev
```
Abrí `http://localhost:3000`.

## 2. Configurar Supabase
1. Creá un proyecto en Supabase.
2. En `Project Settings > API`, copiá la URL del proyecto y la clave publicable (`anon`).
3. Pegalas en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Abrí `SQL Editor` en Supabase y ejecutá el contenido de `supabase/schema.sql`.
5. En `NEXT_PUBLIC_WHATSAPP_NUMBER`, colocá el teléfono real del negocio en formato internacional, sin `+`, espacios ni guiones.

Si Supabase todavía no está configurado, el sitio usa productos de demostración locales.

## 3. Publicar en Vercel
1. Subí esta carpeta a un repositorio privado de GitHub.
2. En Vercel, elegí `Add New > Project` e importá ese repositorio.
3. Configurá las tres variables de entorno anteriores en `Settings > Environment Variables`.
4. Presioná `Deploy`.

## Estructura
```text
tu-sublimacion-creativa/
├── app/
│   ├── globals.css      # Diseño responsive y colores de marca
│   ├── layout.tsx       # Metadatos y layout general
│   └── page.tsx         # Tienda, catálogo, filtros y carrito
├── lib/
│   ├── products.ts      # Categorías y datos de demostración
│   └── supabase.ts      # Cliente de Supabase
├── supabase/
│   └── schema.sql       # Tabla products y políticas de lectura
├── .env.example
└── README.md
```

## Antes de publicar
- Reemplazá las imágenes y precios de demostración por los productos reales.
- Configurá el número de WhatsApp correcto.
- El panel de administración privado todavía no está incluido: debe añadirse con autenticación de Supabase y políticas RLS seguras antes de permitir gestionar productos.
- La primera versión no cobra online ni guarda pedidos en una base de datos.
- Para producción, revisá licencias y derechos de las imágenes que uses.
