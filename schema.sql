-- Tu Sublimación Creativa
-- Ejecutar en Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  category text not null check (category in (
    'Tazas', 'Remeras', 'Llaveros', 'Botellas',
    'Regalos personalizados', 'Gorras', 'Souvenirs', 'Otros productos'
  )),
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  image_url text not null default '',
  featured boolean not null default false,
  is_active boolean not null default true,
  stock integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_active_idx on public.products(is_active);
create index if not exists products_featured_idx on public.products(featured);

alter table public.products enable row level security;

-- Cualquiera puede ver los productos activos del catálogo.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (is_active = true);

-- La escritura debe realizarse desde un panel autenticado.
-- No habilitar INSERT/UPDATE/DELETE públicos. Las políticas de administración
-- se agregan cuando se implemente el panel privado.

insert into public.products
(name, slug, category, description, price, image_url, featured, is_active)
values
('Taza personalizada', 'taza-personalizada', 'Tazas', 'Una taza con tu foto, frase o diseño favorito.', 8500, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85', true, true),
('Remera sublimada', 'remera-sublimada', 'Remeras', 'Diseños alegres y personalizados para regalar.', 14000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', true, true),
('Llavero personalizado', 'llavero-personalizado', 'Llaveros', 'Un recuerdo especial para llevar a todas partes.', 3500, 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=900&q=85', true, true),
('Botella personalizada', 'botella-personalizada', 'Botellas', 'Tu nombre, colores y estilo en una botella.', 12500, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85', true, true)
on conflict (slug) do nothing;
