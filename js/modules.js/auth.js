import { getUsers, saveUsers } from "./store.js";

const SESSION = "tecnostock_session_v1";

export function login(username, password) {
    const user = getUsers().find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password && u.active);
    if (!user) return null;
    const session = { id: user.id, username: user.username, name: user.name, role: user.role };
    sessionStorage.setItem(SESSION, JSON.stringify(session));
    return session;
}

export function currentSession() {
    try {
        const s = JSON.parse(sessionStorage.getItem(SESSION));
        const u = getUsers().find(x => x.id === s?.id && x.active);
        return u ? { id: u.id, username: u.username, name: u.name, role: u.role } : null;
    } catch {
        return null;
    }
}

export function logout() {
    sessionStorage.removeItem(SESSION);
}

export function addUser(user) {
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) throw new Error("Ese nombre de usuario ya existe.");
    users.push({ ...user, id: crypto.randomUUID(), active: true });
    saveUsers(users);
}

export function updateUser(id, changes) {
    const users = getUsers(), target = users.find(u => u.id === id);
    if (!target) throw new Error("No se encontró la cuenta.");
    if (changes.name) target.name = changes.name.trim();
    if (changes.role) target.role = changes.role;
    saveUsers(users);
}

export function toggleUser(id, session) {
    const users = getUsers(), target = users.find(u => u.id === id);
    if (!target) throw new Error("No se encontró la cuenta.");
    if (target.id === session.id) throw new Error("No puedes desactivar tu propia cuenta activa.");
    if (target.active && target.role === "admin" && users.filter(u => u.role === "admin" && u.active).length <= 1) throw new Error("Debe mantenerse al menos un administrador activo.");
    target.active = !target.active;
    saveUsers(users);
}

export function removeUser(id, session) {
    const users = getUsers(), target = users.find(u => u.id === id);
    if (!target) throw new Error("No se encontró la cuenta.");
    if (target.id === session.id) throw new Error("No puedes eliminar tu propia cuenta durante la sesión.");
    if (target.role === "admin" && users.filter(u => u.role === "admin" && u.active).length <= 1) throw new Error("Debe mantenerse al menos un administrador activo.");
    saveUsers(users.filter(u => u.id !== id));
}