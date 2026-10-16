/* =========================================================
   TECNOSTOCK - JAVASCRIPT MODERNO ES6+
   1. Datos iniciales
   2. Almacenamiento local
   3. Lógica del inventario
   4. Manipulación del DOM
   5. Eventos e inicio de la aplicación
   ========================================================= */

// Imagen SVG integrada para los productos que no tengan imagen.
const DEFAULT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <rect width="640" height="480" fill="#f1f5f9"/>
    <rect x="180" y="110" width="280" height="210" rx="18"
          fill="#dbeafe" stroke="#93c5fd" stroke-width="8"/>
    <circle cx="260" cy="190" r="30" fill="#60a5fa"/>
    <path d="M205 285l75-70 55 48 42-38 58 60z" fill="#2563eb"/>
    <text x="320" y="390" text-anchor="middle"
          font-family="Arial" font-size="28" fill="#475569">
      Sin imagen
    </text>
  </svg>
`)}`;

// =========================================================
// 1. DATOS INICIALES
// =========================================================

const INITIAL_PRODUCTS = [
    {
        id: 1,
        code: "TEC-001",
        name: "Laptop Lenovo IdeaPad 3",
        category: "Computadoras",
        brand: "Lenovo",
        supplier: "RyM Portátiles",
        location: "Almacén A · Estante 1",
        price: 2499.90,
        stock: 8,
        minStock: 3,
        image: "https://rymportatiles.com.pe/cdn/shop/files/IdeaPad-Slim-3-15IRH10_PORTADA_ef6bd703-9953-49e6-b04a-fde3740b9411.jpg?v=1779074349&width=1214",
        description: "Laptop de 15.6 pulgadas, Ryzen 5, 8 GB de RAM y SSD de 512 GB.",
        createdAt: "2026-10-01T09:00:00-05:00",
        updatedAt: "2026-10-05T10:30:00-05:00"
    },
    {
        id: 2,
        code: "TEC-002",
        name: "Teclado mecánico RGB",
        category: "Periféricos",
        brand: "Fantech",
        supplier: "HCA Perú",
        location: "Almacén A · Estante 2",
        price: 189.90,
        stock: 4,
        minStock: 5,
        image: "https://hca.pe/storage/media/large_D31UG2rp551uxftCBjVctkfc1l3HbSs3jAusWad1.png",
        description: "Teclado mecánico con iluminación RGB y conexión USB.",
        createdAt: "2026-10-01T09:10:00-05:00",
        updatedAt: "2026-10-05T10:30:00-05:00"
    },
    {
        id: 3,
        code: "TEC-003",
        name: "Mouse inalámbrico",
        category: "Periféricos",
        brand: "Logitech",
        supplier: "Ripley Perú",
        location: "Almacén A · Estante 2",
        price: 79.90,
        stock: 15,
        minStock: 5,
        image: "https://rimage.ripley.com.pe/home.ripley/Attachment/WOP/1/2065372113817/full_image-2065372113817.webp",
        description: "Mouse ergonómico inalámbrico con receptor USB.",
        createdAt: "2026-10-01T09:20:00-05:00",
        updatedAt: "2026-10-05T09:15:00-05:00"
    },
    {
        id: 4,
        code: "TEC-004",
        name: "Monitor Samsung 24 pulgadas",
        category: "Monitores",
        brand: "Samsung",
        supplier: "Fabritec Perú",
        location: "Almacén B · Zona monitores",
        price: 699.90,
        stock: 0,
        minStock: 2,
        image: "https://www.fabritec.pe/assets/media/producto/1413-MONITOR-SAMSUNG-S3-24_1.jpg",
        description: "Monitor Full HD con panel IPS y entrada HDMI.",
        createdAt: "2026-10-01T09:30:00-05:00",
        updatedAt: "2026-10-04T16:00:00-05:00"
    },
    {
        id: 5,
        code: "TEC-005",
        name: "Audífonos gamer",
        category: "Audio",
        brand: "Genérico",
        supplier: "Solumática Perú",
        location: "Almacén A · Estante 3",
        price: 149.90,
        stock: 6,
        minStock: 4,
        image: "https://solumaticaperu.com/wp-content/uploads/2023/08/01-48.jpg",
        description: "Audífonos con micrófono, sonido envolvente y conexión USB.",
        createdAt: "2026-10-01T09:40:00-05:00",
        updatedAt: "2026-10-04T16:10:00-05:00"
    }
];

const INITIAL_MOVEMENTS = [
    {
        id: 1,
        productId: 2,
        productName: "Teclado mecánico RGB",
        type: "salida",
        quantity: 2,
        previousStock: 6,
        finalStock: 4,
        reason: "Venta",
        date: "05/10/2026 10:30"
    },
    {
        id: 2,
        productId: 3,
        productName: "Mouse inalámbrico",
        type: "entrada",
        quantity: 10,
        previousStock: 5,
        finalStock: 15,
        reason: "Compra a proveedor",
        date: "05/10/2026 09:15"
    }
];

// =========================================================
// 2. ALMACENAMIENTO LOCAL
// =========================================================

const Storage = (() => {
    const PRODUCT_KEY = "tecnostock_products";
    const MOVEMENT_KEY = "tecnostock_movements";
    const memory = {};

    const clone = data => JSON.parse(JSON.stringify(data));

    const initialByCode = Object.fromEntries(
        INITIAL_PRODUCTS.map(product => [product.code, product])
    );

    const normalizeProduct = product => {
        const reference = initialByCode[product.code] || {};
        const now = new Date().toISOString();

        return {
            ...product,
            id: Number(product.id),
            code: String(product.code || "").toUpperCase(),
            name: String(product.name || "Producto sin nombre"),
            category: String(product.category || "Sin categoría"),
            brand: String(
                product.brand ||
                reference.brand ||
                "Sin especificar"
            ),
            supplier: String(
                product.supplier ||
                reference.supplier ||
                "Sin especificar"
            ),
            location: String(
                product.location ||
                reference.location ||
                "Sin asignar"
            ),
            price: Number(product.price) || 0,
            stock: Math.max(0, Number(product.stock) || 0),
            minStock: Math.max(1, Number(product.minStock) || 1),
            image:
                product.image && !String(product.image).startsWith("img/")
                    ? String(product.image)
                    : (reference.image || ""),
            description: String(product.description || ""),
            createdAt:
                product.createdAt ||
                reference.createdAt ||
                now,
            updatedAt:
                product.updatedAt ||
                reference.updatedAt ||
                product.createdAt ||
                now
        };
    };

    const read = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            const parsed = saved
                ? JSON.parse(saved)
                : clone(fallback);

            const data = Array.isArray(parsed)
                ? parsed
                : clone(fallback);

            return key === PRODUCT_KEY
                ? data.map(normalizeProduct)
                : data;
        } catch (error) {
            console.warn(
                "No fue posible leer localStorage. Se usarán datos temporales.",
                error
            );

            const data = memory[key] || clone(fallback);

            return key === PRODUCT_KEY
                ? data.map(normalizeProduct)
                : data;
        }
    };

    const write = (key, data) => {
        memory[key] = clone(data);

        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn(
                "No fue posible guardar en localStorage.",
                error
            );
        }
    };

    return {
        getProducts: () => read(PRODUCT_KEY, INITIAL_PRODUCTS),

        getMovements: () => read(
            MOVEMENT_KEY,
            INITIAL_MOVEMENTS
        ),

        saveProducts: products => write(
            PRODUCT_KEY,
            products
        ),

        saveMovements: movements => write(
            MOVEMENT_KEY,
            movements
        ),

        reset: () => {
            write(PRODUCT_KEY, INITIAL_PRODUCTS);
            write(MOVEMENT_KEY, INITIAL_MOVEMENTS);
        }
    };
})();

// Estado central de la aplicación.
const state = {
    products: Storage.getProducts(),
    movements: Storage.getMovements(),
    selectedProductId: null,
    page: 1,
    pageSize: 5,

    filters: {
        search: "",
        category: "todas",
        status: "todos",
        sort: "nombre-asc"
    }
};

// =========================================================
// 3. LÓGICA DEL INVENTARIO
// =========================================================

const Inventory = (() => {
    // Aplicación de if, else if y else.
    const getStatus = product => {
        if (product.stock === 0) {
            return "agotado";
        } else if (product.stock <= product.minStock) {
            return "bajo";
        } else {
            return "disponible";
        }
    };

    const getStatusText = status => ({
        disponible: "Disponible",
        bajo: "Stock bajo",
        agotado: "Agotado"
    })[status] || "Sin estado";

    const findProduct = id => state.products.find(
        product => product.id === Number(id)
    );

    const getSummary = () => state.products.reduce(
        (summary, product) => {
            summary.products += 1;
            summary.units += product.stock;
            summary.value += product.stock * product.price;

            const status = getStatus(product);

            if (status === "bajo") {
                summary.low += 1;
            }

            if (status === "agotado") {
                summary.soldOut += 1;
            }

            return summary;
        },
        {
            products: 0,
            units: 0,
            value: 0,
            low: 0,
            soldOut: 0
        }
    );

    const normalizeText = text => String(text || "")
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const sortProducts = products => {
        const sorted = [...products];

        // Aplicación de switch para ordenar productos.
        switch (state.filters.sort) {
            case "nombre-desc":
                return sorted.sort(
                    (a, b) => b.name.localeCompare(a.name, "es")
                );

            case "precio-asc":
                return sorted.sort(
                    (a, b) => a.price - b.price
                );

            case "precio-desc":
                return sorted.sort(
                    (a, b) => b.price - a.price
                );

            case "stock-asc":
                return sorted.sort(
                    (a, b) => a.stock - b.stock
                );

            case "stock-desc":
                return sorted.sort(
                    (a, b) => b.stock - a.stock
                );

            case "reciente":
                return sorted.sort(
                    (a, b) =>
                        new Date(b.updatedAt) -
                        new Date(a.updatedAt)
                );

            case "nombre-asc":
            default:
                return sorted.sort(
                    (a, b) => a.name.localeCompare(b.name, "es")
                );
        }
    };

    const getFilteredProducts = () => {
        const query = normalizeText(state.filters.search);

        const filtered = state.products.filter(product => {
            const searchable = normalizeText([
                product.name,
                product.code,
                product.category,
                product.brand,
                product.supplier,
                product.location
            ].join(" "));

            const matchesSearch = searchable.includes(query);

            const matchesCategory =
                state.filters.category === "todas" ||
                product.category === state.filters.category;

            const matchesStatus =
                state.filters.status === "todos" ||
                getStatus(product) === state.filters.status;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });

        return sortProducts(filtered);
    };

    const getPagination = () => {
        const products = getFilteredProducts();

        const totalPages = Math.max(
            1,
            Math.ceil(products.length / state.pageSize)
        );

        state.page = Math.min(
            Math.max(1, state.page),
            totalPages
        );

        const start = (state.page - 1) * state.pageSize;

        return {
            products: products.slice(
                start,
                start + state.pageSize
            ),
            total: products.length,
            totalPages,
            start
        };
    };

    const getCategorySummary = () => {
        const summary = state.products.reduce(
            (result, product) => {
                if (!result[product.category]) {
                    result[product.category] = {
                        references: 0,
                        units: 0
                    };
                }

                result[product.category].references += 1;
                result[product.category].units += product.stock;

                return result;
            },
            {}
        );

        return Object.entries(summary)
            .map(([category, data]) => ({
                category,
                ...data
            }))
            .sort((a, b) => b.units - a.units);
    };

    const codeExists = (
        code,
        ignoredId = null
    ) => state.products.some(product => (
        product.code.toUpperCase() === code.toUpperCase() &&
        product.id !== Number(ignoredId)
    ));

    const nextId = list => {
        if (list.length === 0) {
            return 1;
        }

        return Math.max(
            ...list.map(item => Number(item.id) || 0)
        ) + 1;
    };

    const createMovement = ({
        product,
        type,
        quantity,
        previousStock,
        finalStock,
        reason
    }) => ({
        id: nextId(state.movements),
        productId: product.id,
        productName: product.name,
        type,
        quantity,
        previousStock,
        finalStock,
        reason,

        date: new Intl.DateTimeFormat("es-PE", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(new Date())
    });

    const saveProduct = productData => {
        const existingIndex = state.products.findIndex(
            product => product.id === Number(productData.id)
        );

        const now = new Date().toISOString();

        // Edición de un producto existente.
        if (existingIndex >= 0) {
            const current = state.products[existingIndex];

            const updated = {
                ...current,
                ...productData,
                id: current.id,

                // El stock solo se modifica mediante movimientos.
                stock: current.stock,

                createdAt: current.createdAt,
                updatedAt: now
            };

            state.products.splice(
                existingIndex,
                1,
                updated
            );

            Storage.saveProducts(state.products);

            return {
                product: updated,
                isNew: false,
                initialMovementCreated: false
            };
        }

        // Registro de un producto nuevo.
        const newProduct = {
            ...productData,
            id: nextId(state.products),
            createdAt: now,
            updatedAt: now
        };

        state.products.push(newProduct);

        let initialMovementCreated = false;

        // Crea automáticamente la entrada de stock inicial.
        if (newProduct.stock > 0) {
            state.movements.unshift(
                createMovement({
                    product: newProduct,
                    type: "entrada",
                    quantity: newProduct.stock,
                    previousStock: 0,
                    finalStock: newProduct.stock,
                    reason: "Stock inicial - registro del producto"
                })
            );

            initialMovementCreated = true;
        }

        Storage.saveProducts(state.products);
        Storage.saveMovements(state.movements);

        return {
            product: newProduct,
            isNew: true,
            initialMovementCreated
        };
    };

    const registerMovement = movementData => {
        const product = findProduct(
            movementData.productId
        );

        if (!product) {
            throw new Error(
                "Selecciona un producto válido."
            );
        }

        if (
            !Number.isInteger(movementData.quantity) ||
            movementData.quantity < 1
        ) {
            throw new Error(
                "La cantidad debe ser un número entero mayor que cero."
            );
        }

        const previousStock = product.stock;
        let finalStock = previousStock;

        // Switch para determinar una entrada o salida.
        switch (movementData.type) {
            case "entrada":
                finalStock += movementData.quantity;
                break;

            case "salida":
                if (movementData.quantity > previousStock) {
                    throw new Error(
                        `Stock insuficiente. Solo hay ${previousStock} unidades disponibles.`
                    );
                }

                finalStock -= movementData.quantity;
                break;

            default:
                throw new Error(
                    "Selecciona un tipo de movimiento válido."
                );
        }

        product.stock = finalStock;
        product.updatedAt = new Date().toISOString();

        const movement = createMovement({
            product,
            type: movementData.type,
            quantity: movementData.quantity,
            previousStock,
            finalStock,
            reason: movementData.reason
        });

        state.movements.unshift(movement);

        Storage.saveProducts(state.products);
        Storage.saveMovements(state.movements);

        return movement;
    };

    const deleteProduct = id => {
        state.products = state.products.filter(
            product => product.id !== Number(id)
        );

        Storage.saveProducts(state.products);
    };

    /*
     * Recupera la trazabilidad de productos que fueron
     * creados antes de incorporar el movimiento inicial.
     */
    const ensureInitialMovements = () => {
        const initialCodes = new Set(
            INITIAL_PRODUCTS.map(product => product.code)
        );

        let recovered = 0;

        state.products.forEach(product => {
            const hasMovement = state.movements.some(
                movement => movement.productId === product.id
            );

            const isUserProduct = !initialCodes.has(
                product.code
            );

            if (
                isUserProduct &&
                product.stock > 0 &&
                !hasMovement
            ) {
                state.movements.unshift(
                    createMovement({
                        product,
                        type: "entrada",
                        quantity: product.stock,
                        previousStock: 0,
                        finalStock: product.stock,
                        reason: "Stock inicial - registro recuperado"
                    })
                );

                recovered += 1;
            }
        });

        if (recovered > 0) {
            Storage.saveMovements(state.movements);
        }

        return recovered;
    };

    return {
        getStatus,
        getStatusText,
        getSummary,
        getFilteredProducts,
        getPagination,
        getCategorySummary,
        findProduct,
        codeExists,
        saveProduct,
        registerMovement,
        deleteProduct,
        ensureInitialMovements
    };
})();

// =========================================================
// 4. INTERFAZ Y MANIPULACIÓN DEL DOM
// =========================================================

const UI = (() => {
    const money = value => new Intl.NumberFormat(
        "es-PE",
        {
            style: "currency",
            currency: "PEN",
            minimumFractionDigits: 2
        }
    ).format(value);

    const formatDate = value => {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Sin fecha";
        }

        return new Intl.DateTimeFormat("es-PE", {
            dateStyle: "short",
            timeStyle: "short"
        }).format(date);
    };

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const showView = viewId => {
        let target = viewId;

        if (
            target === "detalle" &&
            !Inventory.findProduct(state.selectedProductId)
        ) {
            target = "productos";
        }

        document.querySelectorAll(".view").forEach(
            view => {
                view.classList.toggle(
                    "active",
                    view.id === target
                );
            }
        );

        document.querySelectorAll(".nav-link").forEach(
            link => {
                const section = target === "detalle"
                    ? "productos"
                    : target;

                link.classList.toggle(
                    "active",
                    link.dataset.view === section
                );
            }
        );

        if (window.location.hash !== `#${target}`) {
            window.history.replaceState(
                null,
                "",
                `#${target}`
            );
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const renderSummary = () => {
        const summary = Inventory.getSummary();

        document.querySelector(
            "#total-productos"
        ).textContent = summary.products;

        document.querySelector(
            "#total-unidades"
        ).textContent = summary.units;

        document.querySelector(
            "#valor-inventario"
        ).textContent = money(summary.value);

        document.querySelector(
            "#total-bajos"
        ).textContent = summary.low;

        document.querySelector(
            "#total-agotados"
        ).textContent = summary.soldOut;

        document.querySelector(
            "#alerta-bajos"
        ).textContent = summary.low;

        document.querySelector(
            "#alerta-agotados"
        ).textContent = summary.soldOut;
    };

    const renderCategories = () => {
        const select = document.querySelector(
            "#filtro-categoria"
        );

        const categories = [
            ...new Set(
                state.products.map(
                    product => product.category
                )
            )
        ].sort(
            (a, b) => a.localeCompare(b, "es")
        );

        select.innerHTML = `
      <option value="todas">Todas</option>

      ${categories.map(category => `
        <option value="${escapeHTML(category)}">
          ${escapeHTML(category)}
        </option>
      `).join("")}
    `;

        if (
            !categories.includes(state.filters.category)
        ) {
            state.filters.category = "todas";
        }

        select.value = state.filters.category;
    };

    const statusBadge = product => {
        const status = Inventory.getStatus(product);

        return `
      <span class="badge badge-${status}">
        ${Inventory.getStatusText(status)}
      </span>
    `;
    };

    const bindImageFallbacks = container => {
        container.querySelectorAll(
            "img.product-image"
        ).forEach(image => {
            if (
                image.dataset.fallbackBound === "true"
            ) {
                return;
            }

            image.dataset.fallbackBound = "true";

            image.addEventListener("error", () => {
                if (image.src !== DEFAULT_IMAGE) {
                    image.src = DEFAULT_IMAGE;
                }
            });
        });
    };

    const renderPagination = ({
        total,
        totalPages
    }) => {
        const pagination = document.querySelector(
            "#paginacion-productos"
        );

        if (total === 0 || totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }

        const pageButtons = Array.from(
            { length: totalPages },
            (_, index) => index + 1
        ).map(page => `
      <button
        class="page-button ${page === state.page ? "active" : ""
            }"
        data-page="${page}"
        type="button"
        aria-label="Página ${page}"
      >
        ${page}
      </button>
    `).join("");

        pagination.innerHTML = `
      <button
        class="page-button"
        data-page="${state.page - 1}"
        type="button"
        ${state.page === 1 ? "disabled" : ""}
      >
        Anterior
      </button>

      ${pageButtons}

      <button
        class="page-button"
        data-page="${state.page + 1}"
        type="button"
        ${state.page === totalPages ? "disabled" : ""}
      >
        Siguiente
      </button>
    `;
    };

    const renderProducts = () => {
        const pagination = Inventory.getPagination();

        const {
            products,
            total,
            start
        } = pagination;

        const tableBody = document.querySelector(
            "#tabla-productos"
        );

        const emptyState = document.querySelector(
            "#productos-vacios"
        );

        if (total === 0) {
            document.querySelector(
                "#contador-productos"
            ).textContent = "0 productos";
        } else {
            const first = start + 1;
            const last = start + products.length;

            document.querySelector(
                "#contador-productos"
            ).textContent = `Mostrando ${first}–${last} de ${total}`;
        }

        tableBody.innerHTML = products.map(product => `
      <tr>
        <td>
          <img
            class="product-image product-image-list"
            src="${escapeHTML(
            product.image || DEFAULT_IMAGE
        )}"
            alt="Imagen de ${escapeHTML(product.name)}"
            loading="lazy"
          >
        </td>

        <td class="product-name-cell">
          <strong>${escapeHTML(product.name)}</strong>

          <small>
            ${escapeHTML(product.code)} ·
            ${escapeHTML(product.brand)}
          </small>
        </td>

        <td>${escapeHTML(product.category)}</td>

        <td>${money(product.price)}</td>

        <td>
          <strong>${product.stock}</strong>
          <small>Mínimo: ${product.minStock}</small>
        </td>

        <td>
          ${statusBadge(product)}
        </td>

        <td>
          <div class="actions">
            <button
              class="btn btn-outline btn-small"
              data-action="detail"
              data-id="${product.id}"
              type="button"
            >
              Detalle
            </button>

            <button
              class="btn btn-outline btn-small"
              data-action="movement"
              data-id="${product.id}"
              type="button"
            >
              Movimiento
            </button>

            <button
              class="btn btn-outline btn-small"
              data-action="edit"
              data-id="${product.id}"
              type="button"
            >
              Editar
            </button>

            <button
              class="btn btn-danger btn-small"
              data-action="delete"
              data-id="${product.id}"
              type="button"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `).join("");

        emptyState.hidden = total !== 0;

        bindImageFallbacks(tableBody);
        renderPagination(pagination);
    };

    const renderProductHistory = productId => {
        const movements = state.movements.filter(
            movement =>
                movement.productId === Number(productId)
        );

        const tableBody = document.querySelector(
            "#tabla-historial-producto"
        );

        document.querySelector(
            "#contador-historial-producto"
        ).textContent = `${movements.length} ${movements.length === 1
            ? "movimiento"
            : "movimientos"
        }`;

        tableBody.innerHTML = movements.length
            ? movements.map(movement => `
          <tr>
            <td>${escapeHTML(movement.date)}</td>

            <td class="${movement.type === "entrada"
                    ? "movement-in"
                    : "movement-out"
                }">
              ${escapeHTML(movement.type)}
            </td>

            <td>
              ${movement.type === "entrada"
                    ? "+"
                    : "−"
                }${movement.quantity}
            </td>

            <td>
              ${movement.previousStock}
              →
              ${movement.finalStock}
            </td>

            <td>${escapeHTML(movement.reason)}</td>
          </tr>
        `).join("")
            : `
        <tr>
          <td colspan="5">
            Este producto aún no tiene movimientos registrados.
          </td>
        </tr>
      `;
    };

    const renderDetail = product => {
        if (!product) {
            return;
        }

        document.querySelector(
            "#detalle-nombre"
        ).textContent = product.name;

        document.querySelector(
            "#detalle-codigo"
        ).textContent = product.code;

        document.querySelector(
            "#detalle-categoria"
        ).textContent = product.category;

        document.querySelector(
            "#detalle-marca"
        ).textContent =
            product.brand || "Sin especificar";

        document.querySelector(
            "#detalle-proveedor"
        ).textContent =
            product.supplier || "Sin especificar";

        document.querySelector(
            "#detalle-ubicacion"
        ).textContent =
            product.location || "Sin asignar";

        document.querySelector(
            "#detalle-precio"
        ).textContent = money(product.price);

        document.querySelector(
            "#detalle-stock"
        ).textContent = `${product.stock} unidades`;

        document.querySelector(
            "#detalle-minimo"
        ).textContent = `${product.minStock} unidades`;

        document.querySelector(
            "#detalle-creado"
        ).textContent = formatDate(product.createdAt);

        document.querySelector(
            "#detalle-actualizado"
        ).textContent = formatDate(product.updatedAt);

        document.querySelector(
            "#detalle-descripcion"
        ).textContent =
            product.description || "Sin descripción";

        document.querySelector(
            "#detalle-estado"
        ).innerHTML = statusBadge(product);

        const image = document.querySelector(
            "#detalle-imagen"
        );

        image.src = product.image || DEFAULT_IMAGE;
        image.alt = `Imagen de ${product.name}`;

        bindImageFallbacks(
            document.querySelector("#detalle")
        );

        renderProductHistory(product.id);
    };

    const updateImagePreview = source => {
        const preview = document.querySelector(
            "#vista-previa-imagen"
        );

        preview.src = source || DEFAULT_IMAGE;

        bindImageFallbacks(
            document.querySelector("#formulario")
        );
    };

    const renderPriority = () => {
        const products = state.products
            .filter(
                product =>
                    Inventory.getStatus(product) !==
                    "disponible"
            )
            .sort((a, b) => a.stock - b.stock);

        document.querySelector(
            "#lista-prioridad"
        ).innerHTML = products.length
                ? products.slice(0, 5).map(product => `
          <li>
            <div>
              <strong>
                ${escapeHTML(product.name)}
              </strong>

              <small>
                ${escapeHTML(product.code)}
                · Stock: ${product.stock}
              </small>
            </div>

            ${statusBadge(product)}
          </li>
        `).join("")
                : `
        <li>
          <span>No existen alertas de stock.</span>
        </li>
      `;
    };

    const renderRecentActivity = () => {
        document.querySelector(
            "#lista-actividad"
        ).innerHTML = state.movements.length
                ? state.movements.slice(0, 5)
                    .map(movement => `
          <li>
            <div>
              <strong>
                ${escapeHTML(movement.productName)}
              </strong>

              <small>
                ${escapeHTML(movement.date)}
                ·
                ${escapeHTML(movement.reason)}
              </small>
            </div>

            <span class="${movement.type === "entrada"
                            ? "movement-in"
                            : "movement-out"
                        }">
              ${movement.type === "entrada"
                            ? "+"
                            : "−"
                        }${movement.quantity}
            </span>
          </li>
        `).join("")
                : `
        <li>
          <span>Aún no existen movimientos.</span>
        </li>
      `;
    };

    const renderCategorySummary = () => {
        const categories =
            Inventory.getCategorySummary();

        const maxUnits = Math.max(
            1,
            ...categories.map(item => item.units)
        );

        document.querySelector(
            "#resumen-categorias"
        ).innerHTML = categories.length
                ? categories.map(item => `
          <div class="category-item">
            <div>
              <strong>
                ${escapeHTML(item.category)}
              </strong>

              <span>${item.units} und.</span>
            </div>

            <small>
              ${item.references}
              ${item.references === 1
                        ? "referencia"
                        : "referencias"
                    }
            </small>

            <div class="category-bar">
              <span
                style="width:${(item.units / maxUnits) * 100
                    }%"
              ></span>
            </div>
          </div>
        `).join("")
                : "<p>No hay categorías registradas.</p>";
    };

    const renderMovementSelect = () => {
        const select = document.querySelector(
            "#movimiento-producto"
        );

        const currentValue = select.value;

        select.innerHTML = `
      <option value="">
        Selecciona un producto
      </option>

      ${[...state.products]
                .sort(
                    (a, b) =>
                        a.name.localeCompare(b.name, "es")
                )
                .map(product => `
          <option value="${product.id}">
            ${escapeHTML(product.name)}
            (stock: ${product.stock})
          </option>
        `).join("")}
    `;

        const stillExists = state.products.some(
            product =>
                String(product.id) === currentValue
        );

        select.value = stillExists
            ? currentValue
            : "";
    };

    const renderMovements = () => {
        const tableBody = document.querySelector(
            "#tabla-movimientos"
        );

        document.querySelector(
            "#contador-movimientos"
        ).textContent = `${state.movements.length} ${state.movements.length === 1
            ? "movimiento"
            : "movimientos"
        }`;

        tableBody.innerHTML = state.movements.length
            ? state.movements.map(movement => `
          <tr>
            <td>${escapeHTML(movement.date)}</td>

            <td>
              ${escapeHTML(movement.productName)}
            </td>

            <td class="${movement.type === "entrada"
                    ? "movement-in"
                    : "movement-out"
                }">
              ${escapeHTML(movement.type)}
            </td>

            <td>
              ${movement.type === "entrada"
                    ? "+"
                    : "−"
                }${movement.quantity}
            </td>

            <td>
              ${movement.previousStock}
              →
              ${movement.finalStock}
            </td>

            <td>${escapeHTML(movement.reason)}</td>
          </tr>
        `).join("")
            : `
        <tr>
          <td colspan="6">
            No existen movimientos registrados.
          </td>
        </tr>
      `;
    };

    const renderAlerts = () => {
        const products = state.products
            .filter(
                product =>
                    Inventory.getStatus(product) !==
                    "disponible"
            )
            .sort((a, b) => a.stock - b.stock);

        document.querySelector(
            "#lista-alertas"
        ).innerHTML = products.length
                ? products.map(product => `
          <li>
            <div>
              <strong>
                ${escapeHTML(product.name)}
              </strong>

              <small>
                ${escapeHTML(product.code)}
                · Stock actual: ${product.stock}
                · Mínimo: ${product.minStock}
              </small>
            </div>

            ${statusBadge(product)}
          </li>
        `).join("")
                : `
        <li>
          <span>
            Todos los productos tienen existencias suficientes.
          </span>
        </li>
      `;
    };

    const renderAll = () => {
        renderSummary();
        renderCategories();
        renderProducts();
        renderPriority();
        renderRecentActivity();
        renderCategorySummary();
        renderMovementSelect();
        renderMovements();
        renderAlerts();

        if (state.selectedProductId) {
            renderDetail(
                Inventory.findProduct(
                    state.selectedProductId
                )
            );
        }
    };

    const clearErrors = () => {
        document.querySelectorAll(
            ".error"
        ).forEach(element => {
            element.textContent = "";
        });

        document.querySelectorAll(
            ".input-error"
        ).forEach(element => {
            element.classList.remove("input-error");
        });
    };

    const clearProductForm = () => {
        document.querySelector(
            "#form-producto"
        ).reset();

        document.querySelector(
            "#producto-id"
        ).value = "";

        document.querySelector(
            "#stock-minimo"
        ).value = 5;

        document.querySelector(
            "#stock"
        ).readOnly = false;

        document.querySelector(
            "#etiqueta-stock"
        ).textContent = "Stock inicial *";

        document.querySelector(
            "#ayuda-stock"
        ).textContent = "";

        document.querySelector(
            "#titulo-formulario"
        ).textContent = "Registrar producto";

        updateImagePreview(DEFAULT_IMAGE);
        clearErrors();
    };

    const fillProductForm = product => {
        document.querySelector(
            "#producto-id"
        ).value = product.id;

        document.querySelector(
            "#codigo"
        ).value = product.code;

        document.querySelector(
            "#nombre"
        ).value = product.name;

        document.querySelector(
            "#categoria"
        ).value = product.category;

        document.querySelector(
            "#marca"
        ).value = product.brand || "";

        document.querySelector(
            "#proveedor"
        ).value = product.supplier || "";

        document.querySelector(
            "#ubicacion"
        ).value = product.location || "";

        document.querySelector(
            "#precio"
        ).value = product.price;

        document.querySelector(
            "#stock"
        ).value = product.stock;

        document.querySelector(
            "#stock"
        ).readOnly = true;

        document.querySelector(
            "#etiqueta-stock"
        ).textContent = "Stock actual";

        document.querySelector(
            "#ayuda-stock"
        ).textContent =
            "Para modificar las existencias utiliza el módulo Movimientos.";

        document.querySelector(
            "#stock-minimo"
        ).value = product.minStock;

        document.querySelector(
            "#descripcion"
        ).value = product.description || "";

        document.querySelector(
            "#imagen"
        ).value = product.image || "";

        document.querySelector(
            "#titulo-formulario"
        ).textContent = "Editar producto";

        updateImagePreview(product.image);
        clearErrors();
        showView("formulario");
    };

    const showErrors = errors => {
        clearErrors();

        Object.entries(errors).forEach(
            ([field, message]) => {
                const inputId = field === "stockMinimo"
                    ? "stock-minimo"
                    : field;

                document.querySelector(
                    `#${inputId}`
                )?.classList.add("input-error");

                const error = document.querySelector(
                    `[data-error="${field}"]`
                );

                if (error) {
                    error.textContent = message;
                }
            }
        );
    };

    const showToast = (
        message,
        type = "success"
    ) => {
        const toast = document.querySelector(
            "#toast"
        );

        toast.textContent = message;

        toast.className = `toast show ${type === "error"
            ? "error-toast"
            : ""
            }`;

        window.clearTimeout(showToast.timer);

        showToast.timer = window.setTimeout(
            () => toast.classList.remove("show"),
            3000
        );
    };

    return {
        showView,
        renderAll,
        renderProducts,
        renderDetail,
        updateImagePreview,
        clearProductForm,
        fillProductForm,
        showErrors,
        showToast,
        money
    };
})();

// =========================================================
// 5. EVENTOS DE LA APLICACIÓN
// =========================================================

const App = (() => {
    const validateProduct = product => {
        const errors = {};

        if (!product.code) {
            errors.codigo = "Ingresa el código.";
        } else if (
            !/^TEC-[0-9]{3,6}$/i.test(product.code)
        ) {
            errors.codigo =
                "Usa el formato TEC-001.";
        } else if (
            Inventory.codeExists(
                product.code,
                product.id
            )
        ) {
            errors.codigo =
                "El código ya está registrado.";
        }

        if (!product.name) {
            errors.nombre = "Ingresa el nombre.";
        }

        if (!product.category) {
            errors.categoria =
                "Ingresa la categoría.";
        }

        if (
            !Number.isFinite(product.price) ||
            product.price <= 0
        ) {
            errors.precio =
                "El precio debe ser mayor que cero.";
        }

        if (
            !Number.isInteger(product.stock) ||
            product.stock < 0
        ) {
            errors.stock =
                "El stock debe ser un entero igual o mayor que cero.";
        }

        if (
            !Number.isInteger(product.minStock) ||
            product.minStock < 1
        ) {
            errors.stockMinimo =
                "El mínimo debe ser un entero mayor que cero.";
        }

        if (product.image) {
            try {
                const imageUrl = new URL(
                    product.image
                );

                if (imageUrl.protocol !== "https:") {
                    errors.imagen =
                        "Utiliza una dirección que comience con https://";
                }
            } catch {
                errors.imagen =
                    "Ingresa una dirección de imagen válida.";
            }
        }

        return errors;
    };

    const getProductFromForm = () => ({
        id:
            Number(
                document.querySelector(
                    "#producto-id"
                ).value
            ) || null,

        code: document.querySelector(
            "#codigo"
        ).value.trim().toUpperCase(),

        name: document.querySelector(
            "#nombre"
        ).value.trim(),

        category: document.querySelector(
            "#categoria"
        ).value.trim(),

        brand:
            document.querySelector(
                "#marca"
            ).value.trim() ||
            "Sin especificar",

        supplier:
            document.querySelector(
                "#proveedor"
            ).value.trim() ||
            "Sin especificar",

        location:
            document.querySelector(
                "#ubicacion"
            ).value.trim() ||
            "Sin asignar",

        price: Number(
            document.querySelector(
                "#precio"
            ).value
        ),

        stock: Number(
            document.querySelector(
                "#stock"
            ).value
        ),

        minStock: Number(
            document.querySelector(
                "#stock-minimo"
            ).value
        ),

        description: document.querySelector(
            "#descripcion"
        ).value.trim(),

        image: document.querySelector(
            "#imagen"
        ).value.trim()
    });

    const openNewProduct = () => {
        UI.clearProductForm();
        UI.showView("formulario");
    };

    const openMovement = productId => {
        UI.showView("movimientos");

        document.querySelector(
            "#movimiento-producto"
        ).value = String(productId || "");

        document.querySelector(
            "#movimiento-cantidad"
        ).focus();
    };

    const handleNavigation = event => {
        const link = event.target.closest(
            "[data-view]"
        );

        if (!link) {
            return;
        }

        event.preventDefault();

        if (
            link.dataset.view === "formulario"
        ) {
            openNewProduct();
        } else {
            UI.showView(link.dataset.view);
        }
    };

    const handleProductSubmit = event => {
        event.preventDefault();

        const product = getProductFromForm();
        const errors = validateProduct(product);

        if (Object.keys(errors).length > 0) {
            UI.showErrors(errors);

            UI.showToast(
                "Revisa los campos señalados.",
                "error"
            );

            return;
        }

        const wasEditing = Boolean(product.id);

        const result = Inventory.saveProduct(
            product
        );

        state.page = Math.max(
            1,
            Math.ceil(
                Inventory.getFilteredProducts().length /
                state.pageSize
            )
        );

        UI.clearProductForm();
        UI.renderAll();
        UI.showView("productos");

        if (wasEditing) {
            UI.showToast(
                "Producto actualizado correctamente."
            );
        } else if (
            result.initialMovementCreated
        ) {
            UI.showToast(
                "Producto registrado con su movimiento de stock inicial."
            );
        } else {
            UI.showToast(
                "Producto registrado con stock agotado."
            );
        }
    };

    const handleProductActions = event => {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) {
            return;
        }

        const product = Inventory.findProduct(
            button.dataset.id
        );

        if (!product) {
            UI.showToast(
                "El producto ya no está disponible.",
                "error"
            );

            return;
        }

        // Switch para distribuir las acciones.
        switch (button.dataset.action) {
            case "detail":
                state.selectedProductId = product.id;
                UI.renderDetail(product);
                UI.showView("detalle");
                break;

            case "movement":
                openMovement(product.id);
                break;

            case "edit":
                UI.fillProductForm(product);
                break;

            case "delete":
                if (
                    window.confirm(
                        `¿Deseas eliminar “${product.name}”? El historial de movimientos se conservará.`
                    )
                ) {
                    Inventory.deleteProduct(product.id);

                    if (
                        state.selectedProductId ===
                        product.id
                    ) {
                        state.selectedProductId = null;
                    }

                    UI.renderAll();

                    UI.showToast(
                        "Producto eliminado. El historial quedó disponible para auditoría."
                    );
                }

                break;

            default:
                UI.showToast(
                    "Acción no reconocida.",
                    "error"
                );
        }
    };

    const handleMovementSubmit = event => {
        event.preventDefault();

        const errorElement =
            document.querySelector(
                "#error-movimiento"
            );

        errorElement.textContent = "";

        const movementData = {
            productId: Number(
                document.querySelector(
                    "#movimiento-producto"
                ).value
            ),

            type: document.querySelector(
                "#movimiento-tipo"
            ).value,

            quantity: Number(
                document.querySelector(
                    "#movimiento-cantidad"
                ).value
            ),

            reason: document.querySelector(
                "#movimiento-motivo"
            ).value.trim()
        };

        if (
            !movementData.productId ||
            !Number.isInteger(
                movementData.quantity
            ) ||
            movementData.quantity < 1 ||
            !movementData.reason
        ) {
            errorElement.textContent =
                "Completa correctamente todos los campos.";

            return;
        }

        try {
            Inventory.registerMovement(
                movementData
            );

            event.currentTarget.reset();

            UI.renderAll();

            UI.showToast(
                "Movimiento registrado y stock actualizado."
            );
        } catch (error) {
            errorElement.textContent =
                error.message;

            UI.showToast(
                error.message,
                "error"
            );
        }
    };

    const handleFilters = () => {
        state.filters.search =
            document.querySelector(
                "#buscar"
            ).value;

        state.filters.category =
            document.querySelector(
                "#filtro-categoria"
            ).value;

        state.filters.status =
            document.querySelector(
                "#filtro-estado"
            ).value;

        state.filters.sort =
            document.querySelector(
                "#orden-productos"
            ).value;

        state.page = 1;

        UI.renderProducts();
    };

    const clearFilters = () => {
        state.filters = {
            search: "",
            category: "todas",
            status: "todos",
            sort: "nombre-asc"
        };

        state.page = 1;

        document.querySelector(
            "#buscar"
        ).value = "";

        document.querySelector(
            "#filtro-categoria"
        ).value = "todas";

        document.querySelector(
            "#filtro-estado"
        ).value = "todos";

        document.querySelector(
            "#orden-productos"
        ).value = "nombre-asc";

        UI.renderProducts();

        UI.showToast(
            "Filtros restablecidos."
        );
    };

    const handlePagination = event => {
        const button = event.target.closest(
            "button[data-page]"
        );

        if (!button || button.disabled) {
            return;
        }

        state.page = Number(
            button.dataset.page
        );

        UI.renderProducts();

        document.querySelector(
            "#productos"
        ).scrollIntoView({
            behavior: "smooth"
        });
    };

    const csvCell = value => {
        const cleanValue = String(
            value ?? ""
        ).replaceAll('"', '""');

        return `"${cleanValue}"`;
    };

    const exportCSV = () => {
        const products =
            Inventory.getFilteredProducts();

        if (products.length === 0) {
            UI.showToast(
                "No existen productos para exportar.",
                "error"
            );

            return;
        }

        const headers = [
            "Código",
            "Producto",
            "Categoría",
            "Marca",
            "Proveedor",
            "Ubicación",
            "Precio",
            "Stock",
            "Stock mínimo",
            "Estado",
            "Actualización"
        ];

        const rows = products.map(product => [
            product.code,
            product.name,
            product.category,
            product.brand,
            product.supplier,
            product.location,
            product.price.toFixed(2),
            product.stock,
            product.minStock,
            Inventory.getStatusText(
                Inventory.getStatus(product)
            ),
            product.updatedAt
        ]);

        const content = [
            headers,
            ...rows
        ].map(
            row => row.map(csvCell).join(";")
        ).join("\n");

        const blob = new Blob(
            [`\ufeff${content}`],
            {
                type: "text/csv;charset=utf-8"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement(
            "a"
        );

        link.href = url;

        link.download =
            `inventario-tecnostock-${new Date()
                .toISOString()
                .slice(0, 10)
            }.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        UI.showToast(
            `${products.length} productos exportados correctamente.`
        );
    };

    const restoreData = () => {
        const confirmed = window.confirm(
            "¿Deseas restaurar los datos iniciales? Los productos y movimientos agregados se reemplazarán."
        );

        if (!confirmed) {
            return;
        }

        Storage.reset();

        state.products =
            Storage.getProducts();

        state.movements =
            Storage.getMovements();

        state.selectedProductId = null;
        state.page = 1;

        state.filters = {
            search: "",
            category: "todas",
            status: "todos",
            sort: "nombre-asc"
        };

        document.querySelector(
            "#buscar"
        ).value = "";

        document.querySelector(
            "#filtro-estado"
        ).value = "todos";

        document.querySelector(
            "#orden-productos"
        ).value = "nombre-asc";

        UI.renderAll();

        UI.showToast(
            "Datos iniciales restaurados."
        );
    };

    const bindEvents = () => {
        // Programación orientada a eventos con addEventListener.
        document.querySelector(
            "#menu-principal"
        ).addEventListener(
            "click",
            handleNavigation
        );

        document.querySelector(
            ".brand"
        ).addEventListener(
            "click",
            handleNavigation
        );

        document.querySelector(
            "#btn-nuevo-header"
        ).addEventListener(
            "click",
            openNewProduct
        );

        document.querySelector(
            "#btn-nuevo-producto"
        ).addEventListener(
            "click",
            openNewProduct
        );

        document.querySelector(
            "#btn-ver-productos"
        ).addEventListener(
            "click",
            () => UI.showView("productos")
        );

        document.querySelector(
            "#btn-cancelar"
        ).addEventListener(
            "click",
            () => {
                UI.clearProductForm();
                UI.showView("productos");
            }
        );

        document.querySelector(
            "#form-producto"
        ).addEventListener(
            "submit",
            handleProductSubmit
        );

        document.querySelector(
            "#tabla-productos"
        ).addEventListener(
            "click",
            handleProductActions
        );

        document.querySelector(
            "#paginacion-productos"
        ).addEventListener(
            "click",
            handlePagination
        );

        document.querySelector(
            "#form-movimiento"
        ).addEventListener(
            "submit",
            handleMovementSubmit
        );

        document.querySelector(
            "#buscar"
        ).addEventListener(
            "input",
            handleFilters
        );

        document.querySelector(
            "#filtro-categoria"
        ).addEventListener(
            "change",
            handleFilters
        );

        document.querySelector(
            "#filtro-estado"
        ).addEventListener(
            "change",
            handleFilters
        );

        document.querySelector(
            "#orden-productos"
        ).addEventListener(
            "change",
            handleFilters
        );

        document.querySelector(
            "#btn-limpiar-filtros"
        ).addEventListener(
            "click",
            clearFilters
        );

        document.querySelector(
            "#btn-exportar"
        ).addEventListener(
            "click",
            exportCSV
        );

        document.querySelector(
            "#btn-restaurar"
        ).addEventListener(
            "click",
            restoreData
        );

        document.querySelector(
            "#imagen"
        ).addEventListener(
            "input",
            event => {
                UI.updateImagePreview(
                    event.target.value.trim()
                );
            }
        );

        document.querySelector(
            "#btn-volver-listado"
        ).addEventListener(
            "click",
            () => UI.showView("productos")
        );

        document.querySelector(
            "#btn-editar-detalle"
        ).addEventListener(
            "click",
            () => {
                const product =
                    Inventory.findProduct(
                        state.selectedProductId
                    );

                if (product) {
                    UI.fillProductForm(product);
                }
            }
        );

        document.querySelector(
            "#btn-movimiento-detalle"
        ).addEventListener(
            "click",
            () => {
                openMovement(
                    state.selectedProductId
                );
            }
        );
    };

    const init = () => {
        try {
            bindEvents();

            const recoveredMovements =
                Inventory.ensureInitialMovements();

            // Guarda los campos migrados de productos antiguos.
            Storage.saveProducts(
                state.products
            );

            UI.renderAll();

            const initialView =
                window.location.hash.replace(
                    "#",
                    ""
                );

            const validViews = [
                "inicio",
                "productos",
                "detalle",
                "formulario",
                "movimientos",
                "alertas"
            ];

            if (initialView === "formulario") {
                openNewProduct();
            } else {
                UI.showView(
                    validViews.includes(initialView)
                        ? initialView
                        : "inicio"
                );
            }

            if (recoveredMovements > 0) {
                UI.showToast(
                    `${recoveredMovements} movimiento inicial recuperado correctamente.`
                );
            }
        } catch (error) {
            console.error(
                "No fue posible iniciar TecnoStock:",
                error
            );

            const notice =
                document.querySelector(
                    ".notice"
                );

            if (notice) {
                notice.textContent =
                    "La aplicación no pudo iniciarse. Revisa la consola y las rutas de los archivos.";

                notice.style.color = "#991b1b";
                notice.style.background = "#fff1f2";
            }
        }
    };

    return {
        init
    };
})();

// La aplicación comienza cuando el DOM está disponible.
document.addEventListener(
    "DOMContentLoaded",
    App.init
);