import { getMovements, saveMovements, getProducts, isoNow } from "./store.js";
import { updateStock } from "./products.js";

export function registerMovement({ productId, type, quantity, reason, user }) {
    const q = Number(quantity), product = getProducts().find(p => p.id === productId);
    if (!product) throw new Error("Selecciona un producto válido.");
    if (!Number.isInteger(q) || q < 1) throw new Error("La cantidad debe ser un número entero mayor que cero.");

    const previous = product.stock, final = type === "in" ? previous + q : previous - q;
    if (final < 0) throw new Error("La salida supera el stock disponible.");

    updateStock(product.id, final);
    const movement = {
        id: crypto.randomUUID(),
        productId,
        productName: product.name,
        type,
        quantity: q,
        previousStock: previous,
        finalStock: final,
        reason: reason.trim(),
        date: isoNow(),
        user
    };

    saveMovements([movement, ...getMovements()]);
    return movement;
}