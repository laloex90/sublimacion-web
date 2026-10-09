export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  featured: boolean;
  is_active: boolean;
};

export const categories = [
  "Tazas",
  "Remeras",
  "Set De Jardín",
  "Llaveros",
  "Pines",
];

export const demoProducts: Product[] = [
  {
    id: "demo-1",
    name: "Taza personalizada",
    category: "Tazas",
    description: "Una taza con tu foto, frase o diseño favorito.",
    price: 8500,
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-2",
    name: "Remera sublimada",
    category: "Remeras",
    description: "Diseños personalizados para regalar o usar.",
    price: 14000,
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-3",
    name: "Set De Jardín personalizado",
    category: "Set De Jardín",
    description: "Un conjunto especial con diseños personalizados.",
    price: 16000,
    image_url:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-4",
    name: "Llavero personalizado",
    category: "Llaveros",
    description: "Un recuerdo especial para llevar a todas partes.",
    price: 3500,
    image_url:
      "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-5",
    name: "Pin personalizado",
    category: "Pines",
    description: "Un pin con tu nombre, imagen o diseño favorito.",
    price: 2500,
    image_url:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}
