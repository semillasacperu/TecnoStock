import { getProducts, saveProducts, isoNow } from "./store.js";

export function statusOf(p) {
    return p.stock === 0 ? "empty" : p.stock <= p.minStock ? "low" : "available";
}

export function saveProduct(data, imageIds = [], imageUrls = []) {
    const all = getProducts();
    const editing = Boolean(data.id);
    const index = all.findIndex(p => p.id === data.id);

    if (all.some(p => p.code.trim().toLowerCase() === data.code.trim().toLowerCase() && p.id !== data.id)) {
        throw new Error("El código de producto ya está registrado.");
    }

    const old = index >= 0 ? all[index] : null;
    const item = {
        ...(old || {}),
        id: old?.id || crypto.randomUUID(),
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        category: data.category.trim(),
        brand: data.brand.trim(),
        price: Number(data.price),
        stock: Number(data.stock),
        minStock: Number(data.minStock),
        description: data.description.trim(),
        images: [...(old?.images || []), ...imageIds],
        imageUrls: [...(old?.imageUrls || []), ...imageUrls],
        imageSources: old?.imageSources || [],
        localImage: old?.localImage || "img/productos/sin-imagen.svg",
        createdAt: old?.createdAt || isoNow(),
        updatedAt: isoNow()
    };

    if (editing && old) {
        item.stock = old.stock;
        item.minStock = Number(data.minStock);
        all[index] = item;
    } else {
        all.unshift(item);
    }

    saveProducts(all);
    return item;
}

export function updateStock(id, stock) {
    const all = getProducts(), p = all.find(x => x.id === id);
    if (!p) throw new Error("Producto no encontrado.");
    p.stock = stock;
    p.updatedAt = isoNow();
    saveProducts(all);
    return p;
}

export function deleteProduct(id) {
    const all = getProducts(), p = all.find(x => x.id === id);
    saveProducts(all.filter(x => x.id !== id));
    return p;
}