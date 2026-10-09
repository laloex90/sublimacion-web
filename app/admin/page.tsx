"use client";
import { useEffect, useState, type FormEvent } from "react"; import { supabase } from "@/lib/supabase"; import { formatPrice, type Product } from "@/lib/products";const defaultCategories = [
  "Tazas",
  "Remeras",
  "Set De Jardín",
  "Llaveros",
  "Pines",];const emptyForm = { name: "", category: "Tazas", description: "", price: "", image_url: "", featured: false, is_active: false, };
type ProductForm = typeof emptyForm;
const inputStyle = { width: "100%", padding: "12px", border: "1px solid #e5dce5", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box" as const, background: "#fff", };
const buttonStyle = { padding: "11px 16px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700, fontSize: "14px", };
export default function AdminPage() { const [sessionReady, setSessionReady] = useState(false); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loggedIn, setLoggedIn] = useState(false); const [authorized, setAuthorized] = useState(false); const [products, setProducts] = useState<Product[]>([]); 
const [categories, setCategories] = useState<string[]>(defaultCategories);
const [newCategory, setNewCategory] = useState("");
const [savingCategory, setSavingCategory] = useState(false);
const [form, setForm] = useState(emptyForm); const [editingId, setEditingId] = useState<string | null>(null); const [selectedImage, setSelectedImage] = useState<File | null>(null); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
useEffect(() => { if (!supabase) { setError("Falta configurar Supabase. Revisá las variables de entorno."); setSessionReady(true); return; }
let mounted = true;

async function checkSession() {
  const { data } = await supabase!.auth.getSession();

  if (mounted && data.session) {
    setLoggedIn(true);
    await checkAdmin();
  }

  if (mounted) setSessionReady(true);
}

async function checkAdmin() {
  const { data, error: adminError } = await supabase!.rpc("is_admin");

  if (!mounted) return;

  if (adminError || data !== true) {
    setAuthorized(false);
    setError(
      "Tu usuario inició sesión, pero no tiene permisos de administrador."
    );
    return;
  }

  setAuthorized(true);
  setError("");
  await refreshCategories();
  await loadProducts();
}

async function loadProducts() {
  const { data, error: loadError } = await supabase!
    .from("products")
    .select(
      "id,name,category,description,price,image_url,featured,is_active"
    )
    .order("created_at", { ascending: false });

  if (!mounted) return;

  if (loadError) {
    setError("No se pudieron cargar los productos: " + loadError.message);
    return;
  }

  setProducts((data ?? []) as Product[]);
}

checkSession();

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(() => {
  // La sesión se comprueba al iniciar y después de cada acción de acceso.
});

return () => {
  mounted = false;
  subscription.unsubscribe();
};
}, []);
async function login(event: FormEvent) { event.preventDefault();
if (!supabase) {
  setError("Supabase no está configurado.");
  return;
}

setLoading(true);
setError("");
setMessage("");

const { error: loginError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (loginError) {
  setError("No se pudo iniciar sesión. Revisá el correo y la contraseña.");
  setLoading(false);
  return;
}

setLoggedIn(true);

const { data, error: adminError } = await supabase.rpc("is_admin");

if (adminError || data !== true) {
  setAuthorized(false);
  setError(
    "El usuario ingresó, pero no figura como administrador en Supabase."
  );
  setLoading(false);
  return;
}

setAuthorized(true);
await refreshProducts();
setMessage("¡Sesión iniciada correctamente!");
setLoading(false);
}
 async function refreshCategories() {
  if (!supabase) return;

  const { data, error: categoriesError } = await supabase
    .from("categories")
    .select("name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (categoriesError) {
    setError(
      "No se pudieron cargar las categorías: " +
        categoriesError.message
    );
    return;
  }

  const savedCategories = (data ?? []).map((item) => item.name);

  setCategories(
    savedCategories.length > 0
      ? savedCategories
      : defaultCategories
  );
}                                    
async function refreshProducts() { if (!supabase) return;
const { data, error: loadError } = await supabase
  .from("products")
  .select(
    "id,name,category,description,price,image_url,featured,is_active"
  )
  .order("created_at", { ascending: false });

if (loadError) {
  setError("No se pudieron cargar los productos: " + loadError.message);
  return;
}

setProducts((data ?? []) as Product[]);
}
async function addCategory() {
  if (!supabase || !authorized) return;

  const name = newCategory.trim();

  if (!name) {
    setError("Escribí el nombre de la categoría.");
    return;
  }

  setSavingCategory(true);
  setError("");
  setMessage("");

  const { error: insertError } = await supabase
    .from("categories")
    .insert({ name });

  if (insertError) {
    setError(
      insertError.code === "23505"
        ? "Esa categoría ya existe."
        : "No se pudo guardar la categoría: " +
            insertError.message
    );
    setSavingCategory(false);
    return;
  }

  await refreshCategories();
  setNewCategory("");
  setMessage("¡Categoría agregada correctamente!");
  setSavingCategory(false);
}                                     
function editProduct(product: Product) { setEditingId(product.id); setForm({ name: product.name, category: product.category, description: product.description ?? "", price: String(product.price), image_url: product.image_url ?? "", featured: product.featured, is_active: product.is_active, }); setSelectedImage(null); setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
function resetForm() { setEditingId(null); setForm(emptyForm); setSelectedImage(null); setMessage(""); setError(""); }
async function saveProduct(event: FormEvent) { event.preventDefault();
if (!supabase || !authorized) return;

const price = Number(form.price);

if (!form.name.trim()) {
  setError("Ingresá el nombre del producto.");
  return;
}

if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
  setError("Ingresá un precio válido.");
  return;
}

setLoading(true);
setError("");
setMessage("");

let imageUrl = form.image_url;

if (selectedImage) {
  const safeName = selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const imagePath = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(imagePath, selectedImage, {
      upsert: false,
      contentType: selectedImage.type || undefined,
    });

  if (uploadError) {
    setError("No se pudo subir la imagen: " + uploadError.message);
    setLoading(false);
    return;
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(imagePath);

  imageUrl = data.publicUrl;
}

const productData = {
  name: form.name.trim(),
  category: form.category,
  description: form.description.trim(),
  price,
  image_url: imageUrl,
  featured: form.featured,
  is_active: form.is_active,
};

const result = editingId
  ? await supabase
      .from("products")
      .update(productData)
      .eq("id", editingId)
  : await supabase.from("products").insert(productData);

if (result.error) {
  setError("No se pudo guardar el producto: " + result.error.message);
  setLoading(false);
  return;
}

await refreshProducts();
resetForm();
setMessage(
  editingId
    ? "Producto actualizado correctamente."
    : "Producto agregado correctamente."
);
setLoading(false);
}
async function toggleActive(product: Product) { if (!supabase || !authorized) return;
setError("");
setMessage("");

const { error: updateError } = await supabase
  .from("products")
  .update({ is_active: !product.is_active })
  .eq("id", product.id);

if (updateError) {
  setError("No se pudo cambiar el estado: " + updateError.message);
  return;
}

await refreshProducts();
setMessage("Estado del producto actualizado.");
}
async function deleteProduct(product: Product) { if (!supabase || !authorized) return;
const confirmed = window.confirm(
  `¿Querés eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`
);

if (!confirmed) return;

setError("");
setMessage("");

const { error: deleteError } = await supabase
  .from("products")
  .delete()
  .eq("id", product.id);

if (deleteError) {
  setError("No se pudo eliminar el producto: " + deleteError.message);
  return;
}

if (editingId === product.id) resetForm();

await refreshProducts();
setMessage("Producto eliminado. La imagen almacenada no se borró.");
}
async function logout() { if (!supabase) return;
await supabase.auth.signOut();
setLoggedIn(false);
setAuthorized(false);
setProducts([]);
resetForm();
setMessage("");
setError("");
}

if (!sessionReady) {
  return (
    <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      Cargando panel de administración...
    </main>
  );
}

if (!loggedIn || !authorized) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 16px",
        background: "linear-gradient(135deg,#fff4f8,#f5f0ff)",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <form
        onSubmit={login}
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 20,
          boxShadow: "0 12px 40px #6e46651c",
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 8 }}>🎨</div>
        <h1 style={{ color: "#543b56", margin: "0 0 8px" }}>
          Tu Sublimación Creativa
        </h1>
        <p style={{ color: "#776a78", marginBottom: 24 }}>
          Panel privado de administración
        </p>

        <label style={{ display: "block", marginBottom: 6 }}>
          Correo electrónico
        </label>
        <input
          style={{ ...inputStyle, marginBottom: 16 }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <label style={{ display: "block", marginBottom: 6 }}>
          Contraseña
        </label>
        <input
          style={{ ...inputStyle, marginBottom: 20 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p style={{ color: "#b4234d", fontSize: 14 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            width: "100%",
            background: "#d94f91",
            color: "#fff",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <p style={{ fontSize: 12, color: "#887c89", marginTop: 18 }}>
          Acceso exclusivo para usuarios autorizados en Supabase.
        </p>
      </form>
    </main>
  );
}

return (
  <main
    style={{
      minHeight: "100vh",
      padding: "24px 16px 60px",
      background: "#faf7fb",
      color: "#352c39",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <p style={{ color: "#d94f91", fontWeight: 700, marginBottom: 6 }}>
            ADMINISTRACIÓN
          </p>
          <h1 style={{ margin: 0, fontSize: 30 }}>
            Tu Sublimación Creativa 🎨
          </h1>
          <p style={{ color: "#776a78" }}>
            Gestioná tu catálogo de productos.
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            ...buttonStyle,
            background: "#eee5ef",
            color: "#543b56",
          }}
        >
          Cerrar sesión
        </button>
      </header>

      {message && (
        <div
          style={{
            background: "#e8f8ed",
            color: "#20653b",
            padding: 13,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fff0f0",
            color: "#a52727",
            padding: 13,
            borderRadius: 10,
            marginBottom: 16,
            overflowWrap: "anywhere",
          }}
        >
          {error}
        </div>
      )}
      <section
  style={{
    background: "#fff",
    padding: 24,
    borderRadius: 18,
    boxShadow: "0 5px 24px #5636560b",
    marginBottom: 30,
  }}
>
  <h2 style={{ marginTop: 0 }}>Administrar categorías</h2>

  <form
    onSubmit={(event) => {
      event.preventDefault();
      void addCategory();
    }}
  >
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <input
        style={{ ...inputStyle, flex: "1 1 220px" }}
        value={newCategory}
        onChange={(event) => setNewCategory(event.target.value)}
        placeholder="Ej. Botellas, Buzos, Gorras"
        required
      />

      <button
        type="submit"
        disabled={savingCategory}
        style={{
          ...buttonStyle,
          background: "#d94f91",
          color: "#fff",
        }}
      >
        {savingCategory ? "Guardando..." : "Agregar categoría"}
      </button>
    </div>
  </form>

  <ul>
    {categories.map((category) => (
      <li key={category}>{category}</li>
    ))}
  </ul>
</section>

      <section
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 18,
          boxShadow: "0 5px 24px #5636560b",
          marginBottom: 30,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingId ? "Editar producto" : "Agregar producto"}
        </h2>

        <form onSubmit={saveProduct}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 16,
            }}
          >
            <div>
              <label>Nombre del producto *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Categoría *</label>
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Precio en pesos argentinos *</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Imagen del producto</label>
              <input
                style={inputStyle}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setSelectedImage(e.target.files?.[0] ?? null)
                }
              />
              <small style={{ color: "#776a78" }}>
                {selectedImage
                  ? selectedImage.name
                  : "Elegí una imagen desde tu dispositivo."}
              </small>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Descripción</label>
            <textarea
              style={{ ...inputStyle, minHeight: 95, resize: "vertical" }}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Contá los detalles del producto..."
            />
          </div>

          {form.image_url && (
            <div style={{ marginTop: 16 }}>
              <p>Imagen actual:</p>
              <img
                src={form.image_url}
                alt="Imagen actual del producto"
                style={{
                  width: 130,
                  height: 130,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid #eee",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              margin: "20px 0",
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />{" "}
              Producto destacado
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />{" "}
              Mostrar en el catálogo público
            </label>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                background: "#d94f91",
                color: "#fff",
              }}
            >
              {loading
                ? "Guardando..."
                : editingId
                  ? "Guardar cambios"
                  : "Agregar producto"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...buttonStyle,
                  background: "#eee5ef",
                  color: "#543b56",
                }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>
            Productos cargados ({products.length})
          </h2>
          <button
            onClick={refreshProducts}
            style={{
              ...buttonStyle,
              background: "#eee5ef",
              color: "#543b56",
            }}
          >
            Actualizar lista
          </button>
        </div>

        {products.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 28,
              color: "#776a78",
            }}
          >
            Todavía no hay productos guardados en la base de datos. Usá el
            formulario para cargar el primero.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {products.map((product) => (
              <article
                key={product.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 16,
                  padding: 16,
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 4px 18px #56365608",
                }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 12,
                      background: "#f7f2f7",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 12,
                      background: "#f7f2f7",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 30,
                    }}
                  >
                    🎨
                  </div>
                )}

                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <h3 style={{ margin: "0 0 6px" }}>{product.name}</h3>
                    {product.featured && (
                      <span style={{ color: "#b14c85", fontSize: 12 }}>
                        ✦ Destacado
                      </span>
                    )}
                  </div>

                  <p style={{ margin: "0 0 6px", color: "#776a78" }}>
                    {product.category}
                  </p>
                  <strong>{formatPrice(product.price)}</strong>
                  <p
                    style={{
                      margin: "8px 0",
                      color: "#776a78",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {product.description}
                  </p>
                  <span
                    style={{
                      fontSize: 12,
                      color: product.is_active ? "#237747" : "#986a27",
                    }}
                  >
                    {product.is_active
                      ? "● Visible en el catálogo"
                      : "● Oculto del catálogo"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => editProduct(product)}
                    style={{
                      ...buttonStyle,
                      background: "#eee5ef",
                      color: "#543b56",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => toggleActive(product)}
                    style={{
                      ...buttonStyle,
                      background: product.is_active ? "#fff0e2" : "#e8f8ed",
                      color: "#543b56",
                    }}
                  >
                    {product.is_active ? "Ocultar" : "Publicar"}
                  </button>

                  <button
                    onClick={() => deleteProduct(product)}
                    style={{
                      ...buttonStyle,
                      background: "#fff0f0",
                      color: "#a52727",
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p style={{ color: "#887c89", fontSize: 12, marginTop: 28 }}>
        Las imágenes reemplazadas o los archivos de productos eliminados
        permanecen en Storage para evitar borrar archivos por error.
      </p>
    </div>
  </main>
);
}
