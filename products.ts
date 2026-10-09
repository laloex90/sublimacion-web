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
  "Llaveros",
  "Botellas",
  "Regalos personalizados",
  "Gorras",
  "Souvenirs",
  "Otros productos",
];

export const demoProducts: Product[] = [
  {
    id: "demo-1",
    name: "Taza personalizada",
    category: "Tazas",
    description: "Una taza con tu foto, frase o diseño favorito.",
    price: 8500,
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-2",
    name: "Remera sublimada",
    category: "Remeras",
    description: "Diseños alegres y personalizados para regalar.",
    price: 14000,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-3",
    name: "Llavero personalizado",
    category: "Llaveros",
    description: "Un recuerdo especial para llevar a todas partes.",
    price: 3500,
    image_url: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-4",
    name: "Botella personalizada",
    category: "Botellas",
    description: "Tu nombre, colores y estilo en una botella.",
    price: 12500,
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-5",
    name: "Gorra personalizada",
    category: "Gorras",
    description: "Un diseño original para completar tu estilo.",
    price: 11000,
    image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85",
    featured: true,
    is_active: true,
  },
  {
    id: "demo-6",
    name: "Regalo personalizado",
    category: "Regalos personalizados",
    description: "Un detalle hecho especialmente para esa persona.",
    price: 16000,
    image_url: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=85",
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
