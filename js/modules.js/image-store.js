const DB = "tecnostock_images_v1", TABLE = "images";

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(TABLE, { keyPath: "id" });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveImage(file) {
    const db = await openDB(), id = crypto.randomUUID();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(TABLE, "readwrite");
        tx.objectStore(TABLE).put({ id, blob: file, type: file.type, name: file.name });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
    db.close();
    return id;
}

export async function getImageURL(id) {
    if (!id) return null;
    try {
        const db = await openDB();
        const result = await new Promise((resolve, reject) => {
            const r = db.transaction(TABLE).objectStore(TABLE).get(id);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        });
        db.close();
        return result ? URL.createObjectURL(result.blob) : null;
    } catch {
        return null;
    }
}

export async function deleteImages(ids = []) {
    if (!ids.length) return;
    const db = await openDB();
    await new Promise(resolve => {
        const tx = db.transaction(TABLE, "readwrite"), s = tx.objectStore(TABLE);
        ids.forEach(id => s.delete(id));
        tx.oncomplete = resolve;
    });
    db.close();
}