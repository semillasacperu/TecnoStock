import { getProducts, getMovements, getUsers } from "./store.js";
import { statusOf, saveProduct, deleteProduct } from "./products.js";
import { registerMovement } from "./movements.js";
import { drawDashboard } from "./dashboard.js";
import { login, currentSession, logout, addUser, removeUser, updateUser, toggleUser } from "./auth.js";
import { saveImage, getImageURL, deleteImages } from "./image-store.js";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const assets = new Map();
let session = null, toastTimer, productRenderVersion = 0;

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const badge = s => `<span class="badge ${s}">${s === "empty" ? "Agotado" : s === "low" ? "Stock bajo" : "Disponible"}</span>`;
const money = n => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
const fallbackImage = "img/productos/sin-imagen.svg";

function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function go(view) {
    if (view === "users" && session?.role !== "admin") view = "dashboard";
    $$(".view").forEach(x => x.classList.toggle("active", x.id === `view-${view}`));
    $$(".nav-link").forEach(x => x.classList.toggle("active", x.dataset.view === view));
    if (view === "dashboard") drawDashboard();
    if (view === "products") renderProducts();
    if (view === "movements") renderMovements();
    if (view === "users") renderUsers();
}

function showApp() {
    session = currentSession();
    if (!session) {
        $("#login-screen").hidden = false;
        $("#app-shell").hidden = true;
        return;
    }
    $("#login-screen").hidden = true;
    $("#app-shell").hidden = false;
    $("#current-user").textContent = `${session.name} · ${session.role === "admin" ? "Administrador" : "Usuario"}`;
    $(".admin-only").hidden = session.role !== "admin";
    go("dashboard");
}

function filteredProducts() {
    const q = $("#search-products").value.trim().toLowerCase();
    const cat = $("#category-filter").value;
    const st = $("#status-filter").value;
    const sort = $("#sort-products").value;
    let list = getProducts().filter(p => (!q || [p.name, p.code, p.brand, p.category].some(v => String(v).toLowerCase().includes(q))) && (!cat || p.category === cat) && (!st || statusOf(p) === st));
    list.sort((a, b) => sort === "price-up" ? a.price - b.price : sort === "price-down" ? b.price - a.price : sort === "stock-up" ? a.stock - b.stock : sort === "recent" ? new Date(b.updatedAt) - new Date(a.updatedAt) : a.name.localeCompare(b.name, "es"));
    return list;
}

async function imageFor(p) {
    if (p.imageUrls?.[0]) return p.imageUrls[0];
    const id = p.images?.[0];
    if (id) {
        if (assets.has(id)) return assets.get(id);
        const url = await getImageURL(id);
        if (url) assets.set(id, url);
        return url || p.localImage || fallbackImage;
    }
    return p.localImage || fallbackImage;
}

async function renderProducts() {
    const renderVersion = ++productRenderVersion;
    const list = filteredProducts();
    const table = $("#products-table");

    const categories = [...new Set(getProducts().map(product => product.category))]
        .sort((a, b) => a.localeCompare(b, "es"));

    const select = $("#category-filter");
    const previousCategory = select.value;

    select.replaceChildren(
        new Option("Todas", ""),
        ...categories.map(category => new Option(category, category))
    );
    select.value = categories.includes(previousCategory) ? previousCategory : "";

    const rows = document.createDocumentFragment();

    for (const product of list) {
        const imageSource = await imageFor(product);

        // Ignora una tabla antigua si ya comenzó un renderizado más reciente.
        if (renderVersion !== productRenderVersion) return;

        const row = document.createElement("tr");

        row.innerHTML = `
      <td>
        <img class="product-thumb"
             src="${esc(imageSource)}"
             alt="${esc(product.name)}"
             loading="lazy">
      </td>
      <td>
        <span class="product-name">${esc(product.name)}</span>
        <small>${esc(product.code)} · ${esc(product.brand || "Sin marca")}</small>
      </td>
      <td>${esc(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>${product.stock}</td>
      <td>${badge(statusOf(product))}</td>
      <td>
        <button class="table-action" data-detail="${esc(product.id)}">Ver</button>
        <button class="table-action" data-edit="${esc(product.id)}">Editar</button>
        <button class="table-action danger" data-delete="${esc(product.id)}">Eliminar</button>
      </td>
    `;

        const image = row.querySelector("img");
        image.addEventListener("error", () => {
            image.onerror = null;
            image.src = fallbackImage;
        });

        rows.append(row);
    }

    if (renderVersion !== productRenderVersion) return;

    // Actualiza la tabla una sola vez, cuando todas las filas están preparadas.
    table.replaceChildren(rows);

    $("#product-count").textContent =
        `${list.length} producto${list.length === 1 ? "" : "s"}`;
    $("#empty-products").hidden = list.length > 0;
}

function renderMovements() {
    const list = getMovements(), body = $("#movements-table");
    body.replaceChildren();
    $("#movement-count").textContent = `${list.length} movimiento${list.length === 1 ? "" : "s"}`;
    $("#empty-movements").hidden = list.length > 0;
    list.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${new Date(m.date).toLocaleString("es-PE")}</td><td>${esc(m.productName)}</td><td>${m.type === "in" ? '<span class="badge available">Entrada</span>' : '<span class="badge low">Salida</span>'}</td><td>${m.quantity}</td><td>${m.finalStock}</td><td>${esc(m.reason)}</td><td>${esc(m.user)}</td>`;
        body.append(tr);
    });
}

function renderUsers() {
    const list = $("#users-list");
    list.replaceChildren();
    getUsers().forEach(u => {
        const row = document.createElement("div");
        row.className = "user-row";
        row.innerHTML = `<div><b>${esc(u.name)}</b><small>@${esc(u.username)} · ${u.role === "admin" ? "Administrador" : "Usuario"} · ${u.active ? "Activo" : "Inactivo"}</small><button class="table-action" data-edit-user="${esc(u.id)}">Editar nombre</button><button class="table-action" data-toggle-user="${esc(u.id)}" ${u.id === session.id ? "disabled" : ""}>${u.active ? "Desactivar" : "Activar"}</button></div><button class="table-action danger" data-remove-user="${esc(u.id)}" ${u.id === session.id ? "disabled title='No puedes eliminar la sesión activa'" : ""}>Eliminar</button>`;
        list.append(row);
    });
}

function refresh() {
    drawDashboard();
    renderProducts();
    renderMovements();
    if (session?.role === "admin") renderUsers();
}

function openDialog(dialog) { dialog.showModal(); }

function closeDialog(dialog, force = false) {
    if (!force && dialog.dataset.dirty === "true" && !confirm("Hay cambios en el formulario. ¿Deseas descartarlos?")) return;
    dialog.dataset.dirty = "false";
    dialog.close();
}

function productFormFor(product) {
    const form = $("#product-form");
    form.reset();
    form.elements.id.value = product?.id || "";
    form.elements.code.value = product?.code || "";
    form.elements.name.value = product?.name || "";
    form.elements.category.value = product?.category || "";
    form.elements.brand.value = product?.brand || "";
    form.elements.price.value = product?.price || "";
    form.elements.stock.value = product?.stock ?? "";
    form.elements.stock.readOnly = Boolean(product);
    form.elements.minStock.value = product?.minStock || 5;
    form.elements.description.value = product?.description || "";
    $("#product-dialog-title").textContent = product ? "Editar producto" : "Registrar producto";
    $("#product-form-message").textContent = product ? "El stock se modifica desde Movimientos." : "";
    $("#existing-images").textContent = product ? `${product.imageUrls?.length || 0} enlace(s) web y ${product.images?.length || 0} archivo(s) ya asociado(s); se conservarán.` : "Las 30 imágenes de demostración se cargan automáticamente desde internet.";
    $("#product-dialog").dataset.dirty = "false";
    openDialog($("#product-dialog"));
}

function parseImageUrls(text) {
    const urls = text.split("\n").map(value => value.trim()).filter(Boolean);
    for (const value of urls) {
        let parsed;
        try { parsed = new URL(value); } catch { throw new Error(`El enlace de imagen no es válido: ${value}`); }
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Los enlaces de imágenes deben comenzar con http:// o https://.");
    }
    return urls;
}

function validateImages(files, newUrls, existing = 0) {
    if (files.length + newUrls.length + existing > 5) throw new Error("Cada producto admite hasta 5 imágenes entre enlaces y archivos.");
    for (const f of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) throw new Error("Usa imágenes JPG, PNG o WebP.");
        if (f.size > 2 * 1024 * 1024) throw new Error(`La imagen ${f.name} supera los 2 MB.`);
    }
}

function renderDetail(product) {
    $("#detail-name").textContent = product.name;
    const host = $("#detail-content");
    host.innerHTML = `<p><b>Código:</b> ${esc(product.code)}　<b>Categoría:</b> ${esc(product.category)}</p><p><b>Marca:</b> ${esc(product.brand || "Sin especificar")}　<b>Precio:</b> ${money(product.price)}</p><p><b>Stock:</b> ${product.stock}　<b>Stock mínimo:</b> ${product.minStock}　${badge(statusOf(product))}</p><p>${esc(product.description || "Sin descripción")}</p><div class="image-preview" id="detail-images"></div>`;
    const area = $("#detail-images");
    const sources = [...(product.imageUrls || [])];

    (product.images || []).forEach(async id => {
        const src = await getImageURL(id);
        if (src) sources.push(src);
        showDetailImages(area, sources, product);
    });

    if (!product.images?.length && product.imageUrls?.length) showDetailImages(area, sources, product);
    if (!sources.length && !product.images?.length) showDetailImages(area, [product.localImage || fallbackImage], product);
    openDialog($("#detail-dialog"));
}

function showDetailImages(area, sources, product) {
    area.replaceChildren();
    sources.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = product.name;
        img.onerror = () => { img.onerror = null; img.src = product.localImage || fallbackImage; };
        area.append(img);
    });
}

export function init() {
    session = currentSession();

    $("#login-form").addEventListener("submit", e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget), u = login(f.get("username"), f.get("password"));
        if (!u) { $("#login-message").textContent = "Usuario o contraseña incorrectos, o cuenta inactiva."; return; }
        $("#login-message").textContent = "";
        e.currentTarget.reset();
        showApp();
    });

    $("#logout-btn").addEventListener("click", () => { logout(); session = null; showApp(); });
    $("#main-nav").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) go(b.dataset.view); });
    $$("[data-view-link]").forEach(b => b.addEventListener("click", () => go(b.dataset.viewLink)));
    $$("[data-open-product]").forEach(b => b.addEventListener("click", () => productFormFor(null)));

    $("#new-movement-btn").addEventListener("click", () => {
        const select = $("#movement-form").elements.productId;
        select.replaceChildren(...getProducts().map(p => new Option(`${p.name} · stock ${p.stock}`, p.id)));
        $("#movement-form").reset();
        $("#movement-form-message").textContent = "";
        $("#movement-dialog").dataset.dirty = "false";
        openDialog($("#movement-dialog"));
    });

    for (const sel of ["#search-products", "#category-filter", "#status-filter", "#sort-products"]) {
        $(sel).addEventListener(sel === "#search-products" ? "input" : "change", renderProducts);
    }

    $("#products-table").addEventListener("click", async e => {
        const b = e.target.closest("button");
        if (!b) return;
        const p = getProducts().find(x => x.id === b.dataset.edit || x.id === b.dataset.detail || x.id === b.dataset.delete);
        if (!p) return;
        if (b.dataset.edit) productFormFor(p);
        if (b.dataset.detail) renderDetail(p);

        if (b.dataset.delete && confirm(`¿Eliminar “${p.name}”? Esta acción no se puede deshacer.`)) {
            deleteProduct(p.id);
            await deleteImages(p.images);
            toast("Producto eliminado.");
            refresh();
        }
    });

    $("#product-form").addEventListener("input", e => { if (e.target.type !== "file") $("#product-dialog").dataset.dirty = "true"; });
    $("#product-form").addEventListener("change", () => $("#product-dialog").dataset.dirty = "true");

    $("#product-form").addEventListener("submit", async e => {
        e.preventDefault();
        const form = e.currentTarget, msg = $("#product-form-message");
        msg.textContent = "";

        try {
            const f = new FormData(form), files = [...form.elements.images.files];
            const imageUrls = parseImageUrls(f.get("imageUrls") || "");
            const old = getProducts().find(p => p.id === f.get("id"));
            const existing = (old?.images?.length || 0) + (old?.imageUrls?.length || 0);
            validateImages(files, imageUrls, existing);

            const imageIds = [];
            for (const file of files) imageIds.push(await saveImage(file));

            saveProduct({
                id: f.get("id"),
                code: f.get("code"),
                name: f.get("name"),
                category: f.get("category"),
                brand: f.get("brand"),
                price: f.get("price"),
                stock: f.get("stock"),
                minStock: f.get("minStock"),
                description: f.get("description")
            }, imageIds, imageUrls);

            closeDialog($("#product-dialog"), true);
            toast(old ? "Producto actualizado." : "Producto registrado.");
            refresh();
        } catch (err) {
            msg.textContent = err.message || "No se pudo guardar el producto.";
        }
    });

    $("#movement-form").addEventListener("input", () => $("#movement-dialog").dataset.dirty = "true");
    $("#movement-form").addEventListener("change", () => $("#movement-dialog").dataset.dirty = "true");

    $("#movement-form").addEventListener("submit", e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget), msg = $("#movement-form-message");
        msg.textContent = "";

        try {
            registerMovement({
                productId: f.get("productId"),
                type: f.get("type"),
                quantity: f.get("quantity"),
                reason: f.get("reason"),
                user: session.username
            });
            closeDialog($("#movement-dialog"), true);
            toast("Movimiento registrado y stock actualizado.");
            refresh();
        } catch (err) {
            msg.textContent = err.message;
        }
    });

    $("#user-form").addEventListener("submit", e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);

        try {
            addUser({
                name: f.get("name").trim(),
                username: f.get("username").trim(),
                password: f.get("password"),
                role: f.get("role")
            });
            e.currentTarget.reset();
            toast("Usuario autorizado agregado.");
            renderUsers();
        } catch (err) {
            toast(err.message);
        }
    });

    $("#users-list").addEventListener("click", e => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.dataset.removeUser || b.dataset.editUser || b.dataset.toggleUser;
        if (!id) return;

        try {
            if (b.dataset.removeUser) {
                if (!confirm("¿Eliminar esta cuenta autorizada?")) return;
                removeUser(id, session);
                toast("Usuario eliminado.");
            } else if (b.dataset.toggleUser) {
                toggleUser(id, session);
                toast("Estado de cuenta actualizado.");
            } else if (b.dataset.editUser) {
                const u = getUsers().find(x => x.id === id), name = prompt("Nombre para mostrar:", u.name);
                if (name === null) return;
                if (!name.trim()) throw new Error("El nombre no puede quedar vacío.");
                updateUser(id, { name });
                toast("Nombre actualizado.");
            }
            renderUsers();
        } catch (err) {
            toast(err.message);
        }
    });

    $$("[data-close-dialog]").forEach(b => b.addEventListener("click", () => closeDialog(b.closest("dialog"))));
    $$("dialog").forEach(d => d.addEventListener("cancel", e => { e.preventDefault(); closeDialog(d); }));
    $("#export-btn").addEventListener("click", exportCSV);
    showApp();

    window.addEventListener("resize", () => {
        if ($("#view-dashboard").classList.contains("active")) drawDashboard();
    });
}

function exportCSV() {
    const rows = [
        ["Código", "Producto", "Categoría", "Marca", "Precio S/", "Stock", "Stock mínimo", "Estado"],
        ...getProducts().map(p => [p.code, p.name, p.category, p.brand, p.price, p.stock, p.minStock, statusOf(p)])
    ];

    const csv = rows.map(r => r.map(v => {
        let x = String(v ?? "");
        if (/^[=+@\-]/.test(x)) x = "'" + x;
        return `"${x.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "tecnostock-inventario.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Archivo CSV descargado.");
}