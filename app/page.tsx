"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Heart, Menu, Palette, Search, ShoppingCart, Sparkles, Truck, MessageCircle, X } from "lucide-react";
import { categories, demoProducts, formatPrice, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "549XXXXXXXXXX";

export default function Home() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("products")
        .select("id,name,category,description,price,image_url,featured,is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (!error && data && data.length) setProducts(data as Product[]);
    }
    loadProducts();
  }, []);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatch = activeCategory === "Todos" || product.category === activeCategory;
    const searchMatch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [products, activeCategory, search]);

  const whatsappLink = (items: Product[]) => {
    const lines = items.map((item) => `• ${item.name} — ${formatPrice(item.price)}`).join("\n");
    const message = `¡Hola! Quiero consultar por estos productos de Tu Sublimación Creativa:\n${lines}\n\n¿Me pasás disponibilidad y opciones de personalización?`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <main>
      <div className="announcement"><Sparkles size={15} /> Diseños personalizados para hacer únicos tus momentos <span>♡</span></div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Tu Sublimación Creativa, inicio">
          <span className="brand-mark"><Palette size={27} /></span>
          <span className="brand-text"><b>Tu Sublimación</b><strong>Creativa</strong></span>
        </a>
        <div className="search-box"><Search size={18}/><input aria-label="Buscar productos" placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <a className="header-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> WhatsApp</a>
        <button className="icon-button mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú">{mobileMenu ? <X/> : <Menu/>}</button>
        <button className="cart-button" onClick={() => document.getElementById("carrito")?.scrollIntoView({ behavior: "smooth" })}><ShoppingCart size={19}/> <span>Carrito ({cart.length})</span></button>
      </header>
      <nav className={`nav ${mobileMenu ? "nav-open" : ""}`}>
        <a href="#inicio">Inicio</a><a href="#categorias">Categorías</a><a href="#catalogo">Catálogo</a><a href="#personalizacion">Personalizados</a><a href="#contacto">Contacto</a>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> HECHO A TU MANERA</div>
          <h1>Regalos únicos,<br/><em>hechos a tu estilo</em><span className="heart">♡</span></h1>
          <p>Personalizá tus momentos con productos de sublimación llenos de color, creatividad y cariño.</p>
          <div className="hero-actions"><a className="button button-pink" href="#catalogo">Ver catálogo <ArrowRight size={17}/></a><a className="button button-green" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Hacé tu pedido</a></div>
          <div className="hero-points"><span><Check/> Diseños personalizados</span><span><Heart/> Hecho con cariño</span><span><Truck/> Envíos a coordinar</span></div>
        </div>
        <div className="hero-art" aria-label="Productos de sublimación de muestra">
          <div className="paint paint-one"/><div className="paint paint-two"/>
          <div className="hero-note">Tu idea,<br/>nuestro trabajo <Heart size={20}/></div>
          <div className="sample-product mug"><span>Tu diseño<br/>favorito ♡</span></div>
          <div className="sample-product shirt"><span>CREÁ<br/>ALGO ÚNICO</span></div>
          <div className="sample-product bottle"><span>GOOD<br/>VIBES</span></div>
          <div className="sample-product cap"><span>Creativa</span></div>
          <div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✿</div>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="section-heading"><div><span className="section-kicker">EXPLORÁ Y ENCONTRÁ</span><h2>Nuestras categorías <span>✦</span></h2><p>Un detalle especial para cada persona y ocasión.</p></div><a href="#catalogo" className="text-link">Ver catálogo completo <ArrowRight size={16}/></a></div>
        <div className="category-grid">
          {categories.map((category, index) => <button key={category} className={`category-card cat-${index}`} onClick={() => { setActiveCategory(category); document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="category-emoji">{["☕","👕","🔑","🧴","🎁","🧢","🎉","🎨"][index]}</span><b>{category}</b><span className="category-arrow"><ArrowRight size={15}/></span>
          </button>)}
        </div>
      </section>

      <section className="section catalog-section" id="catalogo">
        <div className="section-heading"><div><span className="section-kicker">HECHOS PARA VOS</span><h2>Productos destacados <span>✦</span></h2><p>Elegí tu favorito y consultanos cómo personalizarlo.</p></div><span className="product-count">{visibleProducts.length} productos</span></div>
        <div className="filters"><button className={activeCategory === "Todos" ? "filter active" : "filter"} onClick={() => setActiveCategory("Todos")}>Todos</button>{categories.map(c => <button key={c} className={activeCategory === c ? "filter active" : "filter"} onClick={() => setActiveCategory(c)}>{c}</button>)}</div>
        <div className="product-grid">
          {visibleProducts.map((product, index) => <article className="product-card" key={product.id}>
            <div className={`product-image image-${index % 6}`}><img src={product.image_url} alt={product.name} loading="lazy"/>{product.featured && <span className="product-badge">Destacado</span>}<button className="favorite" aria-label={`Agregar ${product.name} al carrito`} onClick={() => setCart(current => [...current, product])}><Heart size={17}/></button></div>
            <div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><strong>{formatPrice(product.price)}</strong><button className="add-button" onClick={() => setCart(current => [...current, product])}>Sumar <span>+</span></button></div><a className="product-whatsapp" href={whatsappLink([product])} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Consultar por WhatsApp</a></div>
          </article>)}
          {visibleProducts.length === 0 && <div className="empty-state">No encontramos productos con esa búsqueda. Probá con otra palabra o categoría.</div>}
        </div>
      </section>

      <section className="benefits" id="personalizacion"><div><span className="benefit-icon pink"><Palette/></span><span><b>Diseños a tu gusto</b><small>Tu idea se convierte en un regalo.</small></span></div><div><span className="benefit-icon green"><MessageCircle/></span><span><b>Atención por WhatsApp</b><small>Consultá personalización y disponibilidad.</small></span></div><div><span className="benefit-icon blue"><Truck/></span><span><b>Entrega a coordinar</b><small>Consultanos por envíos y retiros.</small></span></div></section>

      <section className="cart-panel section" id="carrito"><div><span className="section-kicker">TU SELECCIÓN</span><h2>Tu carrito <span>♡</span></h2><p>Agregá productos y enviá tu consulta por WhatsApp.</p></div>{cart.length ? <><ul className="cart-list">{cart.map((item, i) => <li key={`${item.id}-${i}`}><span>{item.name}</span><b>{formatPrice(item.price)}</b><button aria-label="Quitar producto" onClick={() => setCart(current => current.filter((_, index) => index !== i))}>×</button></li>)}</ul><div className="cart-total"><b>Total estimado: {formatPrice(cart.reduce((sum, item) => sum + item.price, 0))}</b><a className="button button-green" href={whatsappLink(cart)} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Enviar pedido por WhatsApp</a></div></> : <div className="cart-empty"><ShoppingCart/><span>Tu carrito está esperando tus favoritos.</span><a href="#catalogo">Explorar productos <ArrowRight size={15}/></a></div>}</section>

      <footer id="contacto"><div className="footer-brand"><span className="brand-mark"><Palette size={25}/></span><span className="brand-text"><b>Tu Sublimación</b><strong>Creativa</strong></span></div><p>Tu idea, nuestro trabajo. ♡</p><a className="button button-green" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Hablemos por WhatsApp</a><small>© {new Date().getFullYear()} Tu Sublimación Creativa · Todos los derechos reservados.</small></footer>
      <a className="floating-whatsapp" href={`https://wa.me/${whatsappNumber}`} aria-label="Contactar por WhatsApp" target="_blank" rel="noreferrer"><MessageCircle/></a>
    </main>
  );
}
