import { getProducts, getMovements, getUsers } from "./store.js";
import { statusOf, saveProduct, deleteProduct } from "./products.js";
import { registerMovement } from "./movements.js";
import { drawDashboard } from "./dashboard.js";
import { login, currentSession, logout, addUser, removeUser, updateUser, toggleUser } from "./auth.js";
import { saveImage, getImageURL, deleteImages } from "./image-store.js";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const assets = new Map();
let session = null, toastTimer, productRenderVersion = 0, searchTimer;

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
    if (!session) { $("#login-screen").hidden = false; $("#app-shell").hidden = true; return; }
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

    let list = getProducts().filter(p =>
        (!q || [p.name, p.code, p.brand, p.category].some(v => String(v).toLowerCase().includes(q))) &&
        (!cat || p.category === cat) &&
        (!st || statusOf(p) === st)
    );

    list.sort((a, b) =>
        sort === "price-up" ? a.price - b.price :
            sort === "price-down" ? b.price - a.price :
                sort === "stock-up" ? a.stock - b.stock :
                    sort === "recent" ? new Date(b.updatedAt) - new Date(a.updatedAt) :
                        a.name.localeCompare(b.name, "es")
    );

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

function updateCategoryFilter() {
    const select = $("#category-filter");
    const previousCategory = select.value;

    const categories = [...new Set(getProducts().map(product => product.category))]
        .sort((a, b) => a.localeCompare(b, "es"));

    select.replaceChildren(
        new Option("Todas", ""),
        ...categories.map(category => new Option(category, category))
    );

    select.value = categories.includes(previousCategory) ? previousCategory : "";
}

function renderProducts() {
    const renderVersion = ++productRenderVersion;
    const list = filteredProducts();
    const table = $("#products-table");
    const rows = document.createDocumentFragment();
    const pendingImages = [];

    for (const product of list) {
        const row = document.createElement("tr");

        row.innerHTML = `
   <td>
    <img class="product-thumb"
         src="${esc(fallbackImage)}"
         alt="${esc(product.name)}"
         loading="lazy"
         width="47"
         height="39">
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
            if (image.dataset.fallbackApplied !== "true") {
                image.dataset.fallbackApplied = "true";
                image.src = fallbackImage;
            }
        });

        pendingImages.push({ image, product });
        rows.append(row);
    }

    // Actualiza la tabla una sola vez, sin esperar la carga de las imágenes.
    table.replaceChildren(rows);

    $("#product-count").textContent =
        `${list.length} producto${list.length === 1 ? "" : "s"}`;
    $("#empty-products").hidden = list.length > 0;

    // Carga las imágenes después de dibujar la tabla.
    for (const { image, product } of pendingImages) {
        imageFor(product)
            .then(source => {
                if (renderVersion === productRenderVersion && image.isConnected) {
                    image.src = source;
                }
            })
            .catch(() => {
                if (renderVersion === productRenderVersion && image.isConnected) {
                    image.src = fallbackImage;
                }
            });
    }
}

function renderMovements() {
    const list = getMovements();
    const body = $("#movements-table");

    body.replaceChildren();
    $("#movement-count").textContent = `${list.length} movimiento${list.length === 1 ? "" : "s"}`;
    $("#empty-movements").hidden = list.length > 0;

    list.forEach(m => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
   <td>${new Date(m.date).toLocaleString("es-PE")}</td>
   <td>${esc(m.productName)}</td>
   <td>${m.type === "in"
                ? '<span class="badge available">Entrada</span>'
                : '<span class="badge low">Salida</span>'}</td>
   <td>${m.quantity}</td>
   <td>${m.finalStock}</td>
   <td>${esc(m.reason)}</td>
   <td>${esc(m.user)}</td>
  `;

        body.append(tr);
    });
}

function renderUsers() {
    const list = $("#users-list");
    list.replaceChildren();

    getUsers().forEach(u => {
        const row = document.createElement("div");
        row.className = "user-row";

        row.innerHTML = `
   <div>
    <b>${esc(u.name)}</b>
    <small>
     @${esc(u.username)} ·
     ${u.role === "admin" ? "Administrador" : "Usuario"} ·
     ${u.active ? "Activo" : "Inactivo"}
    </small>
    <button class="table-action" data-edit-user="${esc(u.id)}">Editar nombre</button>
    <button class="table-action" data-toggle-user="${esc(u.id)}" ${u.id === session.id ? "disabled" : ""}>
     ${u.active ? "Desactivar" : "Activar"}
    </button>
   </div>
   <button class="table-action danger"
           data-remove-user="${esc(u.id)}"
           ${u.id === session.id ? "disabled title='No puedes eliminar la sesión activa'" : ""}>
    Eliminar
   </button>
  `;

        list.append(row);
    });
}

function refresh() {
    updateCategoryFilter();
    drawDashboard();
    renderProducts();
    renderMovements();

    if (session?.role === "admin") renderUsers();
}

function openDialog(dialog) {
    dialog.showModal();
}

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
    $("#existing-images").textContent = product
        ? `${product.imageUrls?.length || 0} enlace(s) web y ${product.images?.length || 0} archivo(s) ya asociado(s); se conservarán.`
        : "Las 30 imágenes de demostración se cargan automáticamente desde internet.";

    $("#product-dialog").dataset.dirty = "false";
    openDialog($("#product-dialog"));
}

function parseImageUrls(text) {
    const urls = text.split("\n").map(value => value.trim()).filter(Boolean);

    for (const value of urls) {
        let parsed;

        try {
            parsed = new URL(value);
        } catch {
            throw new Error(`El enlace de imagen no es válido: ${value}`);
        }

        if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error("Los enlaces de imágenes deben comenzar con http:// o https://.");
        }
    }

    return urls;
}

function validateImages(files, newUrls, existing = 0) {
    if (files.length + newUrls.length + existing > 5) {
        throw new Error("Cada producto admite hasta 5 imágenes entre enlaces y archivos.");
    }

    for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            throw new Error("Usa imágenes JPG, PNG o WebP.");
        }

        if (file.size > 2 * 1024 * 1024) {
            throw new Error(`La imagen ${file.name} supera los 2 MB.`);
        }
    }
}

function renderDetail(product) {
    $("#detail-name").textContent = product.name;

    const host = $("#detail-content");

    host.innerHTML = `
  <p>
   <b>Código:</b> ${esc(product.code)}
  　<b>Categoría:</b> ${esc(product.category)}
  </p>
  <p>
   <b>Marca:</b> ${esc(product.brand || "Sin especificar")}
  　<b>Precio:</b> ${money(product.price)}
  </p>
  <p>
   <b>Stock:</b> ${product.stock}
  　<b>Stock mínimo:</b> ${product.minStock}
  　${badge(statusOf(product))}
  </p>
  <p>${esc(product.description || "Sin descripción")}</p>
  <div class="image-preview" id="detail-images"></div>
 `;

    const area = $("#detail-images");
    const sources = [...(product.imageUrls || [])];

    (product.images || []).forEach(async id => {
        const src = await getImageURL(id);

        if (src) sources.push(src);

        showDetailImages(area, sources, product);
    });

    if (!product.images?.length && product.imageUrls?.length) {
        showDetailImages(area, sources, product);
    }

    if (!sources.length && !product.images?.length) {
        showDetailImages(area, [product.localImage || fallbackImage], product);
    }

    openDialog($("#detail-dialog"));
}

function showDetailImages(area, sources, product) {
    area.replaceChildren();

    sources.forEach(src => {
        const img = document.createElement("img");

        img.src = src;
        img.alt = product.name;
        img.onerror = () => {
            img.onerror = null;
            img.src = product.localImage || fallbackImage;
        };

        area.append(img);
    });
}

export function init() {
    session = currentSession();

    $("#login-form").addEventListener("submit", e => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const user = login(formData.get("username"), formData.get("password"));

        if (!user) {
            $("#login-message").textContent = "Usuario o contraseña incorrectos, o cuenta inactiva.";
            return;
        }

        $("#login-message").textContent = "";
        e.currentTarget.reset();
        showApp();
    });

    $("#logout-btn").addEventListener("click", () => {
        logout();
        session = null;
        showApp();
    });

    $("#main-nav").addEventListener("click", e => {
        const button = e.target.closest("[data-view]");
        if (button) go(button.dataset.view);
    });

    $$("[data-view-link]").forEach(button =>
        button.addEventListener("click", () => go(button.dataset.viewLink))
    );

    $$("[data-open-product]").forEach(button =>
        button.addEventListener("click", () => productFormFor(null))
    );

    $("#new-movement-btn").addEventListener("click", () => {
        const select = $("#movement-form").elements.productId;

        select.replaceChildren(
            ...getProducts().map(product =>
                new Option(`${product.name} · stock ${product.stock}`, product.id)
            )
        );

        $("#movement-form").reset();
        $("#movement-form-message").textContent = "";
        $("#movement-dialog").dataset.dirty = "false";
        openDialog($("#movement-dialog"));
    });

    updateCategoryFilter();

    $("#search-products").addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(renderProducts, 180);
    });

    for (const selector of [
        "#category-filter",
        "#status-filter",
        "#sort-products"
    ]) {
        $(selector).addEventListener("change", renderProducts);
    }

    $("#products-table").addEventListener("click", async e => {
        const button = e.target.closest("button");
        if (!button) return;

        const product = getProducts().find(item =>
            item.id === button.dataset.edit ||
            item.id === button.dataset.detail ||
            item.id === button.dataset.delete
        );

        if (!product) return;

        if (button.dataset.edit) productFormFor(product);
        if (button.dataset.detail) renderDetail(product);

        if (button.dataset.delete && confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) {
            deleteProduct(product.id);
            await deleteImages(product.images);
            toast("Producto eliminado.");
            refresh();
        }
    });

    $("#product-form").addEventListener("input", e => {
        if (e.target.type !== "file") {
            $("#product-dialog").dataset.dirty = "true";
        }
    });

    $("#product-form").addEventListener("change", () => {
        $("#product-dialog").dataset.dirty = "true";
    });

    $("#product-form").addEventListener("submit", async e => {
        e.preventDefault();

        const form = e.currentTarget;
        const message = $("#product-form-message");
        message.textContent = "";

        try {
            const formData = new FormData(form);
            const files = [...form.elements.images.files];
            const imageUrls = parseImageUrls(formData.get("imageUrls") || "");
            const oldProduct = getProducts().find(product => product.id === formData.get("id"));
            const existing = (oldProduct?.images?.length || 0) + (oldProduct?.imageUrls?.length || 0);

            validateImages(files, imageUrls, existing);

            const imageIds = [];

            for (const file of files) {
                imageIds.push(await saveImage(file));
            }

            saveProduct({
                id: formData.get("id"),
                code: formData.get("code"),
                name: formData.get("name"),
                category: formData.get("category"),
                brand: formData.get("brand"),
                price: formData.get("price"),
                stock: formData.get("stock"),
                minStock: formData.get("minStock"),
                description: formData.get("description")
            }, imageIds, imageUrls);

            closeDialog($("#product-dialog"), true);
            toast(oldProduct ? "Producto actualizado." : "Producto registrado.");
            refresh();
        } catch (error) {
            message.textContent = error.message || "No se pudo guardar el producto.";
        }
    });

    $("#movement-form").addEventListener("input", () => {
        $("#movement-dialog").dataset.dirty = "true";
    });

    $("#movement-form").addEventListener("change", () => {
        $("#movement-dialog").dataset.dirty = "true";
    });

    $("#movement-form").addEventListener("submit", e => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const message = $("#movement-form-message");
        message.textContent = "";

        try {
            registerMovement({
                productId: formData.get("productId"),
                type: formData.get("type"),
                quantity: formData.get("quantity"),
                reason: formData.get("reason"),
                user: session.username
            });

            closeDialog($("#movement-dialog"), true);
            toast("Movimiento registrado y stock actualizado.");
            refresh();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    $("#user-form").addEventListener("submit", e => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        try {
            addUser({
                name: formData.get("name").trim(),
                username: formData.get("username").trim(),
                password: formData.get("password"),
                role: formData.get("role")
            });

            e.currentTarget.reset();
            toast("Usuario autorizado agregado.");
            renderUsers();
        } catch (error) {
            toast(error.message);
        }
    });

    $("#users-list").addEventListener("click", e => {
        const button = e.target.closest("button");
        if (!button) return;

        const id = button.dataset.removeUser ||
            button.dataset.editUser ||
            button.dataset.toggleUser;

        if (!id) return;

        try {
            if (button.dataset.removeUser) {
                if (!confirm("¿Eliminar esta cuenta autorizada?")) return;
                removeUser(id, session);
                toast("Usuario eliminado.");
            } else if (button.dataset.toggleUser) {
                toggleUser(id, session);
                toast("Estado de cuenta actualizado.");
            } else if (button.dataset.editUser) {
                const user = getUsers().find(item => item.id === id);
                const name = prompt("Nombre para mostrar:", user.name);

                if (name === null) return;
                if (!name.trim()) throw new Error("El nombre no puede quedar vacío.");

                updateUser(id, { name });
                toast("Nombre actualizado.");
            }

            renderUsers();
        } catch (error) {
            toast(error.message);
        }
    });

    $$("[data-close-dialog]").forEach(button =>
        button.addEventListener("click", () => closeDialog(button.closest("dialog")))
    );

    $$("dialog").forEach(dialog =>
        dialog.addEventListener("cancel", e => {
            e.preventDefault();
            closeDialog(dialog);
        })
    );

    $("#export-btn").addEventListener("click", exportCSV);

    showApp();

    window.addEventListener("resize", () => {
        if ($("#view-dashboard").classList.contains("active")) {
            drawDashboard();
        }
    });
}

function exportCSV() {
    const rows = [
        ["Código", "Producto", "Categoría", "Marca", "Precio S/", "Stock", "Stock mínimo", "Estado"],
        ...getProducts().map(product => [
            product.code,
            product.name,
            product.category,
            product.brand,
            product.price,
            product.stock,
            product.minStock,
            statusOf(product)
        ])
    ];

    const csv = rows.map(row => row.map(value => {
        let cell = String(value ?? "");

        if (/^[=+@\-]/.test(cell)) {
            cell = "'" + cell;
        }

        return `"${cell.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    );
    link.download = "tecnostock-inventario.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    toast("Archivo CSV descargado.");
}