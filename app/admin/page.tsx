"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

import { formatPrice, type Product } from "@/lib/products";

// Supabase se configura mediante las variables de entorno del proyecto.
const db = supabase!;

type Category = { name: string; icon_emoji: string | null; icon_image_url: string | null };
type SiteSettings = { hero_title: string; hero_subtitle: string; hero_image_url: string | null; hero_button_text: string; hero_button_url: string; facebook_url: string; instagram_url: string };
type PortfolioItem = { id: string; title: string; description: string; category: string; image_url: string; is_active: boolean; is_featured: boolean; sort_order: number };

const defaultCategories: Category[] = [
  { name: "Tazas", icon_emoji: "☕", icon_image_url: null },
  { name: "Remeras", icon_emoji: "👕", icon_image_url: null },
  { name: "Set De Jardín", icon_emoji: "🌱", icon_image_url: null },
  { name: "Llaveros", icon_emoji: "🔑", icon_image_url: null },
  { name: "Pines", icon_emoji: "📌", icon_image_url: null },
];
const emptyProduct = { name: "", category: "Tazas", description: "", price: "", image_url: "", featured: false, is_active: true };
const emptyPortfolio = { title: "", description: "", category: "Tazas", image_url: "", is_active: true, is_featured: false };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 12px", border: "1px solid #dce3ef", borderRadius: 9, marginTop: 5, marginBottom: 12, color: "#192b50", background: "white" };
const buttonStyle: React.CSSProperties = { padding: "10px 14px", border: 0, borderRadius: 9, background: "#12264e", color: "white", fontWeight: 800, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { ...buttonStyle, background: "#eaf0fb", color: "#12264e" };

export default function AdminPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("✨");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryEditEmoji, setCategoryEditEmoji] = useState("✨");
  const [categoryEditImage, setCategoryEditImage] = useState<File | null>(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({
  hero_title: "Regalos únicos, hechos a tu estilo",
  hero_subtitle: "Personalizá tus momentos con productos de sublimación llenos de color, creatividad y cariño.",
  hero_image_url: "",
  hero_button_text: "Ver catálogo",
  hero_button_url: "#catalogo",
  facebook_url: "https://www.facebook.com/sublimacion.creativa.667600",
  instagram_url: "https://instagram.com/tusublicretiva?dlrf=OXoyMHMyMjNqcDBp"
});
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioForm, setPortfolioForm] = useState({ ...emptyPortfolio });
  const [portfolioImage, setPortfolioImage] = useState<File | null>(null);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data } = await db.auth.getSession();
      if (data.session && mounted) await checkAdmin();
      if (mounted) setSessionReady(true);
    }
    init();
    const { data: listener } = db.auth.onAuthStateChange((_event, session) => {
      if (!session) { setIsAdmin(false); setProducts([]); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function checkAdmin() {
    const { data, error: adminError } = await db.rpc("is_admin");
    if (adminError || !data) { setIsAdmin(false); setError("La cuenta no tiene permisos de administrador."); return; }
    setIsAdmin(true); setError("");
    await Promise.all([loadProducts(), loadCategories(), loadSettings(), loadPortfolio()]);
  }
  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const { error: loginError } = await db.auth.signInWithPassword({ email, password });
    if (loginError) { setError(loginError.message); setBusy(false); return; }
    await checkAdmin(); setBusy(false);
  }
  async function logout() { await db.auth.signOut(); setIsAdmin(false); setPassword(""); setMessage("Sesión cerrada."); }
  async function loadProducts() {
    const { data, error: e } = await db.from("products").select("id,name,category,description,price,image_url,featured,is_active").order("created_at", { ascending: false });
    if (e) setError(e.message); else setProducts((data || []) as Product[]);
  }
  async function loadCategories() {
    const { data, error: e } = await db.from("categories").select("name,icon_emoji,icon_image_url").order("name", { ascending: true });
    if (!e && data) setCategories(data as Category[]);
  }
  async function loadSettings() {
  const { data, error: e } = await db
    .from("site_settings")
    .select("hero_title,hero_subtitle,hero_image_url,hero_button_text,hero_button_url,facebook_url,instagram_url")
    .eq("id", 1)
    .maybeSingle();

  if (!e && data) {
    setSettings({
      ...data,
      facebook_url: data.facebook_url || "",
      instagram_url: data.instagram_url || ""
    } as SiteSettings);
  }
}
  async function loadPortfolio() {
    const { data, error: e } = await db.from("portfolio_items").select("id,title,description,category,image_url,is_active,is_featured,sort_order").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (!e && data) setPortfolio(data as PortfolioItem[]);
  }
  async function uploadImage(file: File, folder: string) {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error: uploadError } = await db.storage.from("product-images").upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { data } = db.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }
  async function saveProduct(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      let imageUrl = form.image_url;
      if (productImage) imageUrl = await uploadImage(productImage, "products");
      const payload = { name: form.name.trim(), category: form.category, description: form.description.trim(), price: Number(form.price), image_url: imageUrl, featured: form.featured, is_active: form.is_active };
      if (!payload.name || !payload.category || !Number.isFinite(payload.price) || payload.price < 0 || !payload.image_url) throw new Error("Completá nombre, categoría, precio e imagen del producto.");
      const result = editingId ? await db.from("products").update(payload).eq("id", editingId) : await db.from("products").insert(payload);
      if (result.error) throw result.error;
      setForm({ ...emptyProduct, category: categories[0]?.name || "Tazas" }); setEditingId(null); setProductImage(null); await loadProducts(); setMessage("Producto guardado correctamente.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el producto."); }
    setBusy(false);
  }
  function editProduct(p: Product) { setEditingId(p.id); setForm({ name: p.name, category: p.category, description: p.description || "", price: String(p.price), image_url: p.image_url || "", featured: p.featured, is_active: p.is_active }); setProductImage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function toggleProduct(p: Product) { const { error: e } = await db.from("products").update({ is_active: !p.is_active }).eq("id", p.id); if (e) setError(e.message); else await loadProducts(); }
  async function deleteProduct(p: Product) { if (!window.confirm(`¿Eliminar el producto “${p.name}”?`)) return; const { error: e } = await db.from("products").delete().eq("id", p.id); if (e) setError(e.message); else { await loadProducts(); setMessage("Producto eliminado."); } }

  async function addCategory(e: FormEvent) {
    e.preventDefault(); const name = newCategory.trim(); if (!name) return;
    setBusy(true); setError("");
    try {
      let iconImageUrl: string | null = null;
      if (categoryImage) iconImageUrl = await uploadImage(categoryImage, "category-icons");
      const { error: e } = await db.from("categories").insert({ name, icon_emoji: categoryEmoji || null, icon_image_url: iconImageUrl });
      if (e) throw e;
      setNewCategory(""); setCategoryEmoji("✨"); setCategoryImage(null); await loadCategories(); setMessage("Categoría agregada.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo agregar la categoría."); }
    setBusy(false);
  }
  async function saveCategoryIcon(name: string) {
    setBusy(true); setError("");
    try {
      const current = categories.find(c => c.name === name);
      let imageUrl = current?.icon_image_url || null;
      if (categoryEditImage) imageUrl = await uploadImage(categoryEditImage, "category-icons");
      const { error: e } = await db.from("categories").update({ icon_emoji: categoryEditEmoji || null, icon_image_url: imageUrl }).eq("name", name);
      if (e) throw e;
      setEditingCategory(null); setCategoryEditImage(null); await loadCategories(); setMessage("Icono de categoría actualizado.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo actualizar el icono."); }
    setBusy(false);
  }
  async function deleteCategory(name: string) {
    if (!window.confirm(`¿Eliminar la categoría “${name}”? Los productos existentes no se borrarán.`)) return;
    const { error: e } = await db.from("categories").delete().eq("name", name);
    if (e) setError(e.message); else { await loadCategories(); setMessage("Categoría eliminada."); }
  }
  async function saveSiteSettings(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      let imageUrl = settings.hero_image_url || null;
      if (heroImage) imageUrl = await uploadImage(heroImage, "hero");
      const payload = { ...settings, hero_image_url: imageUrl, updated_at: new Date().toISOString() };
      const { error: e } = await db.from("site_settings").upsert({ id: 1, ...payload });
      if (e) throw e;
      setSettings({ ...settings, hero_image_url: imageUrl }); setHeroImage(null); setMessage("Portada actualizada.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar la portada."); }
    setBusy(false);
  }
  async function savePortfolio(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      let imageUrl = portfolioForm.image_url;
      if (portfolioImage) imageUrl = await uploadImage(portfolioImage, "portfolio");
      if (!portfolioForm.title.trim() || !imageUrl) throw new Error("El trabajo necesita título e imagen.");
      const payload = { title: portfolioForm.title.trim(), description: portfolioForm.description.trim(), category: portfolioForm.category, image_url: imageUrl, is_active: portfolioForm.is_active, is_featured: portfolioForm.is_featured, sort_order: 0 };
      const result = editingPortfolioId ? await db.from("portfolio_items").update(payload).eq("id", editingPortfolioId) : await db.from("portfolio_items").insert(payload);
      if (result.error) throw result.error;
      setPortfolioForm({ ...emptyPortfolio }); setPortfolioImage(null); setEditingPortfolioId(null); await loadPortfolio(); setMessage("Trabajo guardado.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el trabajo."); }
    setBusy(false);
  }
  function editPortfolio(item: PortfolioItem) { setEditingPortfolioId(item.id); setPortfolioForm({ title: item.title, description: item.description || "", category: item.category || categories[0]?.name || "Tazas", image_url: item.image_url, is_active: item.is_active, is_featured: item.is_featured ?? false }); setPortfolioImage(null); }
  async function togglePortfolio(item: PortfolioItem) { const { error: e } = await db.from("portfolio_items").update({ is_active: !item.is_active }).eq("id", item.id); if (e) setError(e.message); else await loadPortfolio(); }
  async function deletePortfolio(item: PortfolioItem) { if (!window.confirm(`¿Eliminar “${item.title}” de Nuestros trabajos?`)) return; const { error: e } = await db.from("portfolio_items").delete().eq("id", item.id); if (e) setError(e.message); else { await loadPortfolio(); setMessage("Trabajo eliminado."); } }

  const panel: React.CSSProperties = { background: "white", border: "1px solid #e4eaf4", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px #12264e08" };
  const label: React.CSSProperties = { display: "block", fontWeight: 800, fontSize: 13, color: "#192b50" };
  if (!sessionReady) return <main style={{ padding: 30, fontFamily: "Arial" }}>Cargando administración…</main>;
  if (!isAdmin) return <main style={{ minHeight: "100vh", background: "#f6f8fd", padding: 20, fontFamily: "Arial,sans-serif", color: "#192b50" }}><form onSubmit={login} style={{ maxWidth: 420, margin: "8vh auto", background: "white", padding: 28, borderRadius: 18, boxShadow: "0 15px 45px #12264e12" }}><h1 style={{ marginTop: 0 }}>Administración</h1><p>Ingresá con tu cuenta administradora de Supabase.</p>{error && <p style={{ color: "#c6285b" }}>{error}</p>}<label style={label}>Correo electrónico<input style={inputStyle} type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label><label style={label}>Contraseña<input style={inputStyle} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button style={{ ...buttonStyle, width: "100%" }} disabled={busy}>{busy ? "Ingresando…" : "Iniciar sesión"}</button></form></main>;

  return <main style={{ minHeight: "100vh", background: "#f6f8fd", padding: "20px 14px 50px", color: "#192b50", fontFamily: "Arial,sans-serif" }}><div style={{ maxWidth: 1000, margin: "auto" }}><header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}><div><h1 style={{ margin: "0 0 5px", fontSize: 28 }}>Tu Sublimación Creativa</h1><p style={{ margin: 0, color: "#6d7891" }}>Panel de administración</p></div><div style={{ display: "flex", gap: 8 }}><a href="/" target="_blank" rel="noreferrer" style={{ ...secondaryButton, display: "inline-block" }}>Ver sitio ↗</a><button style={secondaryButton} onClick={logout}>Cerrar sesión</button></div></header>
  {message && <p role="status" style={{ background: "#e8fff4", color: "#08794e", padding: 12, borderRadius: 9 }}>{message}</p>}{error && <p role="alert" style={{ background: "#fff0f4", color: "#b42355", padding: 12, borderRadius: 9 }}>{error}</p>}

  <section style={panel}><h2 style={{ marginTop: 0 }}>🖼️ Portada de la página principal</h2><form onSubmit={saveSiteSettings}><label style={label}>Título<input style={inputStyle} value={settings.hero_title} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} required /></label><label style={label}>Texto descriptivo<textarea style={{ ...inputStyle, minHeight: 85 }} value={settings.hero_subtitle} onChange={e => setSettings({ ...settings, hero_subtitle: e.target.value })} /></label><label style={label}>Texto del botón<input style={inputStyle} value={settings.hero_button_text} onChange={e => setSettings({ ...settings, hero_button_text: e.target.value })} /></label><label style={label}>Destino del botón (por ejemplo #catalogo o un enlace)<input style={inputStyle} value={settings.hero_button_url} onChange={e => setSettings({ ...settings, hero_button_url: e.target.value })} /></label><label style={label}>Imagen de portada<input style={inputStyle} type="file" accept="image/*" onChange={e => setHeroImage(e.target.files?.[0] || null)} /></label>{settings.hero_image_url && <p><a href={settings.hero_image_url} target="_blank" rel="noreferrer">Ver imagen actual</a></p>}

<h3>Redes sociales</h3>

<label style={label}>
  Enlace de Facebook
  <input
    style={inputStyle}
    type="url"
    value={settings.facebook_url}
    onChange={e =>
      setSettings({ ...settings, facebook_url: e.target.value })
    }
    placeholder="https://www.facebook.com/tu-pagina"
  />
</label>

<label style={label}>
  Enlace de Instagram
  <input
    style={inputStyle}
    type="url"
    value={settings.instagram_url}
    onChange={e =>
      setSettings({ ...settings, instagram_url: e.target.value })
    }
    placeholder="https://www.instagram.com/tu-perfil"
  />
</label>
<button style={buttonStyle} disabled={busy}>{busy ? "Guardando…" : "Guardar portada"}</button></form></section>

  <section style={panel}><h2 style={{ marginTop: 0 }}>✨ Administrar categorías e iconos</h2><p style={{ color: "#6d7891", fontSize: 13 }}>Podés usar un emoji o subir una imagen para representar cada categoría.</p><form onSubmit={addCategory} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, alignItems: "end" }}><label style={label}>Nombre<input style={inputStyle} value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ej.: Botellas" required /></label><label style={label}>Emoji<input style={inputStyle} value={categoryEmoji} onChange={e => setCategoryEmoji(e.target.value)} maxLength={8} /></label><label style={label}>Imagen del icono (opcional)<input style={inputStyle} type="file" accept="image/*" onChange={e => setCategoryImage(e.target.files?.[0] || null)} /></label><button style={{ ...buttonStyle, marginBottom: 12 }} disabled={busy}>Agregar categoría</button></form><div style={{ display: "grid", gap: 10 }}>{categories.map(c => <div key={c.name} style={{ border: "1px solid #e5eaf4", borderRadius: 11, padding: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}><div style={{ width: 45, height: 45, display: "grid", placeItems: "center", background: "#f5f7fc", borderRadius: 10, fontSize: 27, overflow: "hidden" }}>{c.icon_image_url ? <img src={c.icon_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : c.icon_emoji || "✨"}</div><b style={{ flex: 1 }}>{c.name}</b>{editingCategory === c.name ? <div style={{ flex: "1 1 280px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}><input aria-label="Emoji" value={categoryEditEmoji} onChange={e => setCategoryEditEmoji(e.target.value)} style={{ ...inputStyle, width: 85, margin: 0 }} /><input aria-label="Imagen del icono" type="file" accept="image/*" onChange={e => setCategoryEditImage(e.target.files?.[0] || null)} style={{ maxWidth: 180 }} /><button style={buttonStyle} onClick={() => saveCategoryIcon(c.name)} disabled={busy}>Guardar</button><button style={secondaryButton} onClick={() => setEditingCategory(null)}>Cancelar</button></div> : <><button style={secondaryButton} onClick={() => { setEditingCategory(c.name); setCategoryEditEmoji(c.icon_emoji || "✨"); setCategoryEditImage(null); }}>Editar icono</button><button style={{ ...buttonStyle, background: "#fff0f4", color: "#b42355" }} onClick={() => deleteCategory(c.name)}>Eliminar</button></>}</div>)}</div></section>

  <section style={panel}><h2 style={{ marginTop: 0 }}>{editingId ? "✏️ Editar producto" : "➕ Agregar producto"}</h2><form onSubmit={saveProduct}><label style={label}>Nombre<input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label><label style={label}>Categoría<select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>{categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label><label style={label}>Descripción<textarea style={{ ...inputStyle, minHeight: 75 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label style={label}>Precio<input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></label><label style={label}>Imagen del producto<input style={inputStyle} type="file" accept="image/*" onChange={e => setProductImage(e.target.files?.[0] || null)} />{form.image_url && <span style={{ display: "block", marginBottom: 10, fontSize: 12 }}>Hay una imagen guardada. Elegí otra solo si querés reemplazarla.</span>}</label><label style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Producto destacado</label><label style={{ display: "flex", gap: 8, marginBottom: 15, alignItems: "center" }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Publicado en la tienda</label><button style={buttonStyle} disabled={busy}>{busy ? "Guardando…" : editingId ? "Guardar cambios" : "Agregar producto"}</button>{editingId && <button type="button" style={{ ...secondaryButton, marginLeft: 8 }} onClick={() => { setEditingId(null); setForm({ ...emptyProduct, category: categories[0]?.name || "Tazas" }); setProductImage(null); }}>Cancelar edición</button>}</form></section>

  <section style={panel}><h2 style={{ marginTop: 0 }}>🛍️ Productos ({products.length})</h2>{products.length === 0 ? <p>Todavía no hay productos cargados.</p> : <div style={{ display: "grid", gap: 10 }}>{products.map(p => <article key={p.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, border: "1px solid #e5eaf4", borderRadius: 12, padding: 12 }}><img src={p.image_url} alt={p.name} style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 9, background: "#f3f5fa" }} /><div style={{ flex: "1 1 180px" }}><b>{p.name}</b><div style={{ color: "#6d7891", fontSize: 12, marginTop: 4 }}>{p.category} · {formatPrice(p.price)}</div><div style={{ fontSize: 12, marginTop: 4 }}>{p.is_active ? "Publicado" : "Oculto"}{p.featured ? " · Destacado" : ""}</div></div><button style={secondaryButton} onClick={() => editProduct(p)}>Editar</button><button style={secondaryButton} onClick={() => toggleProduct(p)}>{p.is_active ? "Ocultar" : "Publicar"}</button><button style={{ ...buttonStyle, background: "#fff0f4", color: "#b42355" }} onClick={() => deleteProduct(p)}>Eliminar</button></article>)}</div>}</section>

  <section style={panel}><h2 style={{ marginTop: 0 }}>{editingPortfolioId ? "✏️ Editar trabajo" : "📸 Agregar a Nuestros trabajos"}</h2><p style={{ color: "#6d7891", fontSize: 13 }}>Publicá ejemplos de tus trabajos personalizados en la página principal.</p><form onSubmit={savePortfolio}><label style={label}>Título<input style={inputStyle} value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} required /></label><label style={label}>Categoría<select style={inputStyle} value={portfolioForm.category} onChange={e => setPortfolioForm({ ...portfolioForm, category: e.target.value })} required>{categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label><label style={label}>Descripción<textarea style={{ ...inputStyle, minHeight: 70 }} value={portfolioForm.description} onChange={e => setPortfolioForm({ ...portfolioForm, description: e.target.value })} /></label><label style={label}>Imagen<input style={inputStyle} type="file" accept="image/*" onChange={e => setPortfolioImage(e.target.files?.[0] || null)} />{portfolioForm.image_url && <span style={{ display: "block", marginBottom: 10, fontSize: 12 }}>Hay una imagen guardada. Elegí otra para reemplazarla.</span>}</label><label style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}><input type="checkbox" checked={portfolioForm.is_featured} onChange={e => setPortfolioForm({ ...portfolioForm, is_featured: e.target.checked })} /> ⭐ Trabajo destacado (aparece primero)</label><label style={{ display: "flex", gap: 8, marginBottom: 15, alignItems: "center" }}><input type="checkbox" checked={portfolioForm.is_active} onChange={e => setPortfolioForm({ ...portfolioForm, is_active: e.target.checked })} /> Publicar en la página</label><button style={buttonStyle} disabled={busy}>{busy ? "Guardando…" : editingPortfolioId ? "Guardar cambios" : "Agregar trabajo"}</button>{editingPortfolioId && <button type="button" style={{ ...secondaryButton, marginLeft: 8 }} onClick={() => { setEditingPortfolioId(null); setPortfolioForm({ ...emptyPortfolio }); setPortfolioImage(null); }}>Cancelar edición</button>}</form><h3>Trabajos cargados ({portfolio.length})</h3>{portfolio.length === 0 ? <p>Todavía no hay trabajos cargados.</p> : <div style={{ display: "grid", gap: 10 }}>{portfolio.map(item => <article key={item.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, border: "1px solid #e5eaf4", borderRadius: 12, padding: 12 }}><img src={item.image_url} alt={item.title} style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 9 }} /><div style={{ flex: "1 1 180px" }}><b>{item.title}</b><div style={{ color: "#6d7891", fontSize: 12 }}>{item.category || "Tazas"} · {item.is_active ? "Publicado" : "Oculto"}{item.is_featured ? " · ⭐ Destacado" : ""}</div></div><button style={secondaryButton} onClick={() => editPortfolio(item)}>Editar</button><button style={secondaryButton} onClick={() => togglePortfolio(item)}>{item.is_active ? "Ocultar" : "Publicar"}</button><button style={{ ...buttonStyle, background: "#fff0f4", color: "#b42355" }} onClick={() => deletePortfolio(item)}>Eliminar</button></article>)}</div>}</section>
  </div></main>;
}
