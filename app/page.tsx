
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Heart, Menu, Palette, Search, ShoppingCart, Sparkles, Truck, MessageCircle, X } from "lucide-react";
import { categories as defaultCategories, formatPrice, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";

type Category = { name: string; icon_emoji: string | null; icon_image_url: string | null };

type SiteSettings = {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  hero_button_text: string;
  hero_button_url: string;
  facebook_url: string;
  instagram_url: string;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5493624642189";

const defaultSettings: SiteSettings = {
  hero_title: "Regalos únicos, hechos a tu estilo",
  hero_subtitle: "Personalizá tus momentos con productos de sublimación llenos de color, creatividad y cariño.",
  hero_image_url: null,
  hero_button_text: "Ver catálogo",
  hero_button_url: "#catalogo",
  facebook_url: "https://www.facebook.com/sublimacion.creativa.667600",
  instagram_url: "https://instagram.com/tusublicretiva?dlrf=OXoyMHMyMjNqcDBp"
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryItems, setCategoryItems] = useState<Category[]>(
    defaultCategories.map((name, i) => ({
      name,
      icon_emoji: ["☕", "👕", "🌱", "🔑", "📌"][i] || "✨",
      icon_image_url: null
    }))
  );
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Carga progresiva: 4 elementos iniciales en cada sección.
  const [visibleProductCount, setVisibleProductCount] = useState(4);
  const [visibleFeaturedCount, setVisibleFeaturedCount] = useState(4);
  const [visiblePortfolioCount, setVisiblePortfolioCount] = useState(4);

  const [activePortfolioCategory, setActivePortfolioCategory] = useState("Todos");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [selectedPortfolioImageIndex, setSelectedPortfolioImageIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [likedPortfolioIds, setLikedPortfolioIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadContent() {
      if (!supabase) return;

      const [productResult, categoryResult, settingsResult, portfolioResult] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,category,description,price,image_url,featured,is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("name,icon_emoji,icon_image_url")
          .eq("is_active", true)
          .order("name", { ascending: true }),

        supabase
          .from("site_settings")
          .select("hero_title,hero_subtitle,hero_image_url,hero_button_text,hero_button_url,facebook_url,instagram_url")
          .eq("id", 1)
          .maybeSingle(),

        supabase
          .from("portfolio_items")
          .select("id,title,description,category,image_url,is_active,is_featured,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);

      if (!productResult.error) {
        setProducts((productResult.data || []) as Product[]);
      }

      if (!categoryResult.error && categoryResult.data?.length) {
        setCategoryItems(categoryResult.data as Category[]);
      }

      if (!settingsResult.error && settingsResult.data) {
  setSettings({
    ...defaultSettings,
    ...settingsResult.data,
    facebook_url: settingsResult.data.facebook_url || "",
    instagram_url: settingsResult.data.instagram_url || ""
  } as SiteSettings);
}

setSettingsLoaded(true);

      if (!portfolioResult.error && portfolioResult.data) {
        const portfolioItems = portfolioResult.data as PortfolioItem[];

        if (portfolioItems.length === 0) {
          setPortfolio([]);
        } else {
          const { data: extraImages, error: extraImagesError } = await supabase
            .from("portfolio_item_images")
            .select("portfolio_item_id,image_url,sort_order")
            .in("portfolio_item_id", portfolioItems.map(item => item.id))
            .order("sort_order", { ascending: true });

          if (extraImagesError) {
            console.error("Error cargando imágenes adicionales:", extraImagesError);
          }

          const itemsWithImages = portfolioItems.map(item => ({
            ...item,
            images: [
              item.image_url,
              ...(extraImages || [])
                .filter(image => image.portfolio_item_id === item.id)
                .map(image => image.image_url),
            ].filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index),
          }));

          setPortfolio(itemsWithImages);
        }
      }
    }

    loadContent();
  }, []);

  const categoryNames = useMemo(
    () => categoryItems.map(c => c.name),
    [categoryItems]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("tsc-portfolio-likes");
      if (saved) setLikedPortfolioIds(JSON.parse(saved) as string[]);
    } catch {
      // Los favoritos siguen funcionando durante esta visita.
    }
  }, []);

  function togglePortfolioLike(id: string) {
    setLikedPortfolioIds(current => {
      const next = current.includes(id)
        ? current.filter(itemId => itemId !== id)
        : [...current, id];

      try {
        window.localStorage.setItem("tsc-portfolio-likes", JSON.stringify(next));
      } catch {
        // No bloquear la interacción si el almacenamiento no está disponible.
      }

      return next;
    });
  }

  const visibleProducts = useMemo(() => products.filter(product => {
    const categoryMatch =
      activeCategory === "Todos" || product.category === activeCategory;

    const searchMatch =
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(search.toLowerCase().trim());

    return categoryMatch && searchMatch;
  }), [products, activeCategory, search]);

  // Los destacados tienen su propia lista, independiente de los filtros del catálogo.
  const featuredProducts = useMemo(
    () => products.filter(product => product.featured),
    [products]
  );

  const visiblePortfolio = useMemo(() => portfolio
    .filter(item =>
      activePortfolioCategory === "Todos" ||
      (item.category || "Tazas") === activePortfolioCategory
    )
    .filter(item =>
      `${item.title} ${item.description} ${item.category || "Tazas"}`
        .toLocaleLowerCase()
        .includes(portfolioSearch.toLocaleLowerCase().trim())
    )
    .sort((a, b) =>
      Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
    [portfolio, activePortfolioCategory, portfolioSearch]
  );

  const displayedProducts = visibleProducts.slice(0, visibleProductCount);
  const displayedFeaturedProducts = featuredProducts.slice(0, visibleFeaturedCount);
  const displayedPortfolio = visiblePortfolio.slice(0, visiblePortfolioCount);

  // Volver a mostrar cuatro elementos al cambiar los filtros del catálogo.
  useEffect(() => {
    setVisibleProductCount(4);
  }, [activeCategory, search]);

  // Volver a mostrar cuatro trabajos al cambiar los filtros de la galería.
  useEffect(() => {
    setVisiblePortfolioCount(4);
  }, [activePortfolioCategory, portfolioSearch]);

  useEffect(() => {
    if (!selectedPortfolioItem) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedPortfolioItem(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [selectedPortfolioItem]);
  // Precarga la imagen actual y las imágenes vecinas del trabajo abierto.
  const preloadedPortfolioImages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedPortfolioItem) return;

    const images = selectedPortfolioItem.images?.length
      ? selectedPortfolioItem.images
      : [selectedPortfolioItem.image_url];

    const total = images.length;

    if (!total) return;

    const indexes = [
      selectedPortfolioImageIndex,
      (selectedPortfolioImageIndex + 1) % total,
      (selectedPortfolioImageIndex - 1 + total) % total,
    ];

    indexes.forEach(index => {
      const url = images[index];

      if (!url || preloadedPortfolioImages.current.has(url)) return;

      preloadedPortfolioImages.current.add(url);

      const image = new Image();
      image.decoding = "async";
      image.src = url;
    });
  }, [selectedPortfolioItem, selectedPortfolioImageIndex]);

  useEffect(() => {
    if (!selectedProduct) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  const whatsappLink = (items: Product[]) => {
    const lines = items
      .map(item => `• ${item.name} — ${formatPrice(item.price)}`)
      .join("\n");

    const message =
      `¡Hola! Quiero consultar por estos productos de Tu Sublimación Creativa:\n${lines}\n\n¿Me pasás disponibilidad y opciones de personalización?`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  function renderProductCard(product: Product, index: number, isFeatured = false) {
    return (
      <article
        className="product-card"
        key={`${isFeatured ? "featured-" : ""}${product.id}`}
      >
        <div className={`product-image image-${index % 6}`}>
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            role="button"
            tabIndex={0}
            aria-label={`Ampliar imagen de ${product.name}`}
            style={{ cursor: "zoom-in" }}
            onClick={() => setSelectedProduct(product)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedProduct(product);
              }
            }}
          />

          {(isFeatured || product.featured) && (
            <span className="product-badge">Destacado</span>
          )}

          <button
            className="favorite"
            aria-label={`Agregar ${product.name} al carrito`}
            onClick={() => setCart(current => [...current, product])}
          >
            <Heart size={17} />
          </button>
        </div>

        <div className="product-info">
          <span className="product-category">{product.category}</span>
          <h3>{product.name}</h3>
          <p>{product.description}</p>

          <div className="product-bottom">
            <strong>{formatPrice(product.price)}</strong>
            <button
              className="add-button"
              onClick={() => setCart(current => [...current, product])}
            >
              Sumar <span>+</span>
            </button>
          </div>

          <a
            className="product-whatsapp"
            href={whatsappLink([product])}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} /> Consultar por WhatsApp
          </a>
        </div>
      </article>
    );
  }

  return (
    <main>
      <div className="announcement">
        <Sparkles size={15} /> Diseños personalizados para hacer únicos tus momentos <span>♡</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Tu Sublimación Creativa, inicio">
          <span className="brand-mark"><Palette size={27} /></span>
          <span className="brand-text"><b>Tu Sublimación</b><strong>Creativa</strong></span>
        </a>

        <div className="search-box">
          <Search size={18} />
          <input
            aria-label="Buscar productos"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <a className="header-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> WhatsApp
        </a>

        <button
          className="icon-button mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Abrir menú"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>

        <button
          className="cart-button"
          onClick={() => document.getElementById("carrito")?.scrollIntoView({ behavior: "smooth" })}
        >
          <ShoppingCart size={19} /> <span>Carrito ({cart.length})</span>
        </button>
      </header>

      <nav className={`nav ${mobileMenu ? "nav-open" : ""}`}>
        <a href="#inicio">Inicio</a>
        <a href="#categorias">Categorías</a>
        <a href="#destacados">Destacados</a>
        <a href="#catalogo">Catálogo</a>
        <a href="#trabajos">Nuestros trabajos</a>
        <a href="#personalizacion">Personalizados</a>
        <a href="#contacto">Contacto</a>
      </nav>

      
<section className="hero" id="inicio">
  <div className="hero-copy">
    <div className="eyebrow">
      <span className="eyebrow-dot" /> HECHO A TU MANERA
    </div>

    <h1>
      {settings.hero_title.split(",")[0]}
      {settings.hero_title.includes(",") ? (
        <>
          <br />
          <em>
            {settings.hero_title.substring(
              settings.hero_title.indexOf(",") + 1
            ).trim()}
          </em>
        </>
      ) : (
        <span className="hero-title-second"><em /></span>
      )}
      <span className="heart">♡</span>
    </h1>

    <p>{settings.hero_subtitle}</p>

    <div className="hero-actions">
      <a
        className="button button-pink"
        href={settings.hero_button_url || "#catalogo"}
      >
        {settings.hero_button_text || "Ver catálogo"}{" "}
        <ArrowRight size={17} />
      </a>

      <a
        className="button button-green"
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={18} /> Hacé tu pedido
      </a>
    </div>

    <div className="hero-points">
      <span><Check /> Diseños personalizados</span>
      <span><Heart /> Hecho con cariño</span>
      <span><Truck /> Envíos a coordinar</span>
    </div>
  </div>

  {!settingsLoaded ? (
    <div className="hero-custom-image" aria-hidden="true" />
  ) : settings.hero_image_url ? (
    <div
      className="hero-custom-image"
      role="img"
      aria-label="Imagen de portada"
      style={{
        backgroundImage: `url("${settings.hero_image_url}")`
      }}
    />
  ) : (
    <div className="hero-art" aria-label="Productos de sublimación de muestra">
      <div className="paint paint-one" />
      <div className="paint paint-two" />
      <div className="hero-note">
        Tu idea,<br />nuestro trabajo <Heart size={20} />
      </div>
      <div className="sample-product mug">
        <span>Tu diseño<br />favorito ♡</span>
      </div>
      <div className="sample-product shirt">
        <span>CREÁ<br />ALGO ÚNICO</span>
      </div>
      <div className="sample-product bottle">
        <span>GOOD<br />VIBES</span>
      </div>
      <div className="sample-product cap"><span>Creativa</span></div>
      <div className="hero-spark spark-a">✦</div>
      <div className="hero-spark spark-b">✿</div>
    </div>
  )}
</section>


      <section className="section" id="categorias">
        <div className="section-heading">
          <div>
            <span className="section-kicker">EXPLORÁ Y ENCONTRÁ</span>
            <h2>Nuestras categorías <span>✦</span></h2>
            <p>Un detalle especial para cada persona y ocasión.</p>
          </div>
          <a href="#catalogo" className="text-link">Ver catálogo completo <ArrowRight size={16} /></a>
        </div>

        <div className="category-grid">
          {categoryItems.map((category, index) => (
            <button
              key={category.name}
              className={`category-card cat-${index % 8}`}
              onClick={() => {
                setActiveCategory(category.name);
                document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="category-emoji">
                {category.icon_image_url
                  ? <img src={category.icon_image_url} alt="" />
                  : category.icon_emoji || "✨"}
              </span>
              <b>{category.name}</b>
              <span className="category-arrow"><ArrowRight size={15} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS: muestra cuatro y agrega cuatro por clic. */}
      <section className="section catalog-section" id="destacados">
        <div className="section-heading">
          <div>
            <span className="section-kicker">HECHOS PARA VOS</span>
            <h2>Productos destacados <span>✦</span></h2>
            <p>Elegí tu favorito y consultanos cómo personalizarlo.</p>
          </div>
          <span className="product-count">{featuredProducts.length} productos</span>
        </div>

        <div className="product-grid">
          {displayedFeaturedProducts.map((product, index) =>
            renderProductCard(product, index, true)
          )}

          {featuredProducts.length === 0 && (
            <div className="empty-state">
              Todavía no hay productos destacados para mostrar.
            </div>
          )}
        </div>

        {featuredProducts.length > visibleFeaturedCount && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button
              type="button"
              className="button button-pink"
              onClick={() => setVisibleFeaturedCount(count => count + 4)}
            >
              Cargar más destacados <ArrowRight size={17} />
            </button>
          </div>
        )}
      </section>

      {/* CATÁLOGO COMPLETO: conserva el buscador, las categorías y el carrito. */}
      <section className="section catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="section-kicker">TODO PARA PERSONALIZAR</span>
            <h2>Catálogo completo <span>✦</span></h2>
            <p>Explorá todos los productos y encontrá tu favorito.</p>
          </div>
          <span className="product-count">{visibleProducts.length} productos</span>
        </div>

        <div className="filters">
          <button
            className={activeCategory === "Todos" ? "filter active" : "filter"}
            onClick={() => setActiveCategory("Todos")}
          >
            Todos
          </button>
          {categoryNames.map(c => (
            <button
              key={c}
              className={activeCategory === c ? "filter active" : "filter"}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {displayedProducts.map((product, index) => renderProductCard(product, index))}

          {visibleProducts.length === 0 && (
            <div className="empty-state">
              No encontramos productos con esa búsqueda. Probá con otra palabra o categoría.
            </div>
          )}
        </div>

        {visibleProducts.length > visibleProductCount && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button
              type="button"
              className="button button-pink"
              onClick={() => setVisibleProductCount(count => count + 4)}
            >
              Cargar más productos <ArrowRight size={17} />
            </button>
          </div>
        )}
      </section>

      {/* PORTFOLIO: conserva búsqueda, filtros, favoritos y galería ampliada. */}
      {portfolio.length > 0 && (
        <section className="section portfolio-section" id="trabajos">
          <div className="section-heading">
            <div>
              <span className="section-kicker">HECHO CON CREATIVIDAD</span>
              <h2>Nuestros trabajos <span>✦</span></h2>
              <p>Algunas ideas que hicimos realidad.</p>
            </div>
          </div>

          <div className="portfolio-search-wrap">
            <Search size={18} />
            <input
              aria-label="Buscar trabajos"
              placeholder="Buscar por nombre, descripción o categoría..."
              value={portfolioSearch}
              onChange={e => setPortfolioSearch(e.target.value)}
            />
          </div>

          <div className="filters portfolio-filters">
            <button
              className={activePortfolioCategory === "Todos" ? "filter active" : "filter"}
              onClick={() => setActivePortfolioCategory("Todos")}
            >
              Todos
            </button>
            {categoryNames.map(c => (
              <button
                key={c}
                className={activePortfolioCategory === c ? "filter active" : "filter"}
                onClick={() => setActivePortfolioCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="portfolio-grid">
            {displayedPortfolio.map(item => (
              <article
                className={`portfolio-card ${item.is_featured ? "portfolio-card-featured" : ""}`}
                key={item.id}
              >
                <div className="portfolio-image-shell">
                  <button
                    type="button"
                    className="portfolio-image-button"
                    onClick={() => {
                      setSelectedPortfolioImageIndex(0);
                      setSelectedPortfolioItem(item);
                    }}
                    aria-label={`Ver trabajo ${item.title}`}
                  >
                    <img src={item.image_url} alt={item.title} loading="lazy" />
                    <span className="portfolio-zoom-hint"><Search size={16} /> Ver detalle</span>
                  </button>

                  {item.is_featured && (
                    <span className="portfolio-featured-badge">⭐ Destacado</span>
                  )}

                  <button
                    type="button"
                    className={`portfolio-like-button ${likedPortfolioIds.includes(item.id) ? "is-liked" : ""}`}
                    onClick={() => togglePortfolioLike(item.id)}
                    aria-label={likedPortfolioIds.includes(item.id) ? "Quitar me gusta" : "Me gusta este trabajo"}
                    aria-pressed={likedPortfolioIds.includes(item.id)}
                  >
                    <Heart
                      size={18}
                      fill={likedPortfolioIds.includes(item.id) ? "currentColor" : "none"}
                    />
                    <span>{likedPortfolioIds.includes(item.id) ? "Te gusta" : "Me gusta"}</span>
                  </button>
                </div>

                <div className="portfolio-card-copy">
                  <span className="portfolio-category-pill">{item.category || "Tazas"}</span>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}

                  <button
                    type="button"
                    className="portfolio-detail-link"
                    onClick={() => {
                      setSelectedPortfolioImageIndex(0);
                      setSelectedPortfolioItem(item);
                    }}
                  >
                    Ver trabajo <ArrowRight size={15} />
                  </button>

                  <a
                    className="portfolio-similar-link"
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`¡Hola! Vi el trabajo "${item.title}" (${item.category || "Tazas"}) en Tu Sublimación Creativa y quisiera consultar por uno parecido.`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={15} /> Quiero uno parecido
                  </a>
                </div>
              </article>
            ))}

            {visiblePortfolio.length === 0 && (
              <div className="empty-state">
                No encontramos trabajos con esos filtros. Probá otra categoría o palabra.
              </div>
            )}
          </div>

          {visiblePortfolio.length > visiblePortfolioCount && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button
                type="button"
                className="button button-pink"
                onClick={() => setVisiblePortfolioCount(count => count + 4)}
              >
                Cargar más trabajos <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
      )}

      {/* VISOR AMPLIADO DE TRABAJOS CON NAVEGACIÓN ENTRE SUS IMÁGENES. */}
      {selectedPortfolioItem && (
        <div
          className="portfolio-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${selectedPortfolioItem.title}`}
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedPortfolioItem(null);
          }}
        >
          <div className="portfolio-lightbox-panel">
            <button
              type="button"
              className="portfolio-lightbox-close"
              onClick={() => setSelectedPortfolioItem(null)}
              aria-label="Cerrar detalle"
            >
              <X size={23} />
            </button>

            <div className="portfolio-lightbox-image-wrap" style={{ position: "relative" }}>
              <img
                src={
                  selectedPortfolioItem.images?.[selectedPortfolioImageIndex] ||
                  selectedPortfolioItem.image_url
                }
                alt={`${selectedPortfolioItem.title} — imagen ${selectedPortfolioImageIndex + 1}`}
              />

              {selectedPortfolioItem.images && selectedPortfolioItem.images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={() =>
                      setSelectedPortfolioImageIndex(index =>
                        (index - 1 + selectedPortfolioItem.images.length) %
                        selectedPortfolioItem.images.length
                      )
                    }
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      color: "#192b50",
                      fontSize: 28,
                      cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
                    }}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() =>
                      setSelectedPortfolioImageIndex(index =>
                        (index + 1) % selectedPortfolioItem.images.length
                      )
                    }
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      color: "#192b50",
                      fontSize: 28,
                      cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
                    }}
                  >
                    ›
                  </button>

                  <span
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(18,38,78,0.85)",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {selectedPortfolioImageIndex + 1} / {selectedPortfolioItem.images.length}
                  </span>
                </>
              )}
            </div>

            <div className="portfolio-lightbox-info">
              <span className="portfolio-category-pill">{selectedPortfolioItem.category || "Tazas"}</span>
              <h2>{selectedPortfolioItem.title}</h2>
              {selectedPortfolioItem.description && <p>{selectedPortfolioItem.description}</p>}

              <button
                type="button"
                className={`portfolio-modal-like ${likedPortfolioIds.includes(selectedPortfolioItem.id) ? "is-liked" : ""}`}
                onClick={() => togglePortfolioLike(selectedPortfolioItem.id)}
                aria-pressed={likedPortfolioIds.includes(selectedPortfolioItem.id)}
              >
                <Heart
                  size={18}
                  fill={likedPortfolioIds.includes(selectedPortfolioItem.id) ? "currentColor" : "none"}
                />
                {likedPortfolioIds.includes(selectedPortfolioItem.id)
                  ? "Te gusta este trabajo"
                  : "Me gusta este trabajo"}
              </button>

              <a
                className="button button-green"
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`¡Hola! Vi el trabajo "${selectedPortfolioItem.title}" en Tu Sublimación Creativa y quisiera consultar por un diseño parecido.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> Quiero uno parecido
              </a>
            </div>
          </div>
        </div>
      )}

      {/* VISOR AMPLIADO DE PRODUCTOS. */}
      {selectedProduct && (
        <div
          className="portfolio-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${selectedProduct.name}`}
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedProduct(null);
          }}
        >
          <div className="portfolio-lightbox-panel">
            <button
              type="button"
              className="portfolio-lightbox-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Cerrar detalle"
            >
              <X size={23} />
            </button>

            <div className="portfolio-lightbox-image-wrap">
              <img src={selectedProduct.image_url} alt={selectedProduct.name} />
            </div>

            <div className="portfolio-lightbox-info">
              <span className="portfolio-category-pill">{selectedProduct.category}</span>
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <h3>{formatPrice(selectedProduct.price)}</h3>

              <a
                className="button button-green"
                href={whatsappLink([selectedProduct])}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <section className="benefits" id="personalizacion">
        <div>
          <span className="benefit-icon pink"><Palette /></span>
          <span><b>Diseños a tu gusto</b><small>Tu idea se convierte en un regalo.</small></span>
        </div>
        <div>
          <span className="benefit-icon green"><MessageCircle /></span>
          <span><b>Atención por WhatsApp</b><small>Consultá personalización y disponibilidad.</small></span>
        </div>
        <div>
          <span className="benefit-icon blue"><Truck /></span>
          <span><b>Entrega a coordinar</b><small>Consultanos por envíos y retiros.</small></span>
        </div>
      </section>

      <section className="cart-panel section" id="carrito">
        <div>
          <span className="section-kicker">TU SELECCIÓN</span>
          <h2>Tu carrito <span>♡</span></h2>
          <p>Agregá productos y enviá tu consulta por WhatsApp.</p>
        </div>

        {cart.length ? (
          <>
            <ul className="cart-list">
              {cart.map((item, i) => (
                <li key={`${item.id}-${i}`}>
                  <span>{item.name}</span>
                  <b>{formatPrice(item.price)}</b>
                  <button
                    aria-label="Quitar producto"
                    onClick={() => setCart(current => current.filter((_, index) => index !== i))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <div className="cart-total">
              <b>Total estimado: {formatPrice(cart.reduce((sum, item) => sum + item.price, 0))}</b>
              <a className="button button-green" href={whatsappLink(cart)} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Enviar pedido por WhatsApp
              </a>
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <ShoppingCart />
            <span>Tu carrito está esperando tus favoritos.</span>
            <a href="#catalogo">Explorar productos <ArrowRight size={15} /></a>
          </div>
        )}
      </section>

      <footer id="contacto">
        <div className="footer-brand">
          <span className="brand-mark"><Palette size={25} /></span>
          <span className="brand-text"><b>Tu Sublimación</b><strong>Creativa</strong></span>
        </div>

        <p>Tu idea, nuestro trabajo. ♡</p>

        <a className="button button-green" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> Hablemos por WhatsApp
        </a>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            margin: "20px 0",
          }}
        >
          {settings.facebook_url && (
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar Facebook"
              title="Facebook"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#1877F2",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.973h-1.513c-1.49 0-1.956.93-1.956 1.886v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              Facebook
            </a>
          )}

          {settings.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar Instagram"
              title="Instagram"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#C13584",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
          )}
        </div>

        <small>
          © {new Date().getFullYear()} Tu Sublimación Creativa · Todos los derechos reservados.
        </small>
      </footer>

      <a
        className="floating-whatsapp"
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </main>
  );
}
