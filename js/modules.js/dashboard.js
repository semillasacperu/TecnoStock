import { getProducts, getMovements } from "./store.js";
import { statusOf } from "./products.js";

const colors = ["#2563eb", "#16a36a", "#f59e0b", "#8b5cf6", "#ec4899", "#0891b2"];
const money = n => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);

export function drawDashboard() {
    const products = getProducts(), moves = getMovements();

    document.querySelector("#metric-products").textContent = products.length;
    document.querySelector("#metric-units").textContent = products.reduce((a, p) => a + p.stock, 0);
    document.querySelector("#metric-value").textContent = money(products.reduce((a, p) => a + p.stock * p.price, 0));
    document.querySelector("#metric-low").textContent = products.filter(p => statusOf(p) === "low").length;
    document.querySelector("#metric-empty").textContent = products.filter(p => statusOf(p) === "empty").length;

    const cats = {};
    products.forEach(p => cats[p.category] = (cats[p.category] || 0) + 1);
    drawDonut("category-chart", "category-legend", cats);

    const recent = document.querySelector("#recent-activity");
    recent.replaceChildren();

    moves.slice(0, 5).forEach(m => {
        const li = document.createElement("li");
        li.textContent = `${m.type === "in" ? "Entrada" : "Salida"} de ${m.quantity} · ${m.productName}`;
        const small = document.createElement("small");
        small.textContent = `${new Date(m.date).toLocaleString("es-PE")} · ${m.user}`;
        li.append(small);
        recent.append(li);
    });

    if (!moves.length) recent.innerHTML = "<li>Sin actividad registrada.</li>";

    const priority = document.querySelector("#priority-table");
    priority.replaceChildren();

    products.filter(p => statusOf(p) !== "available").forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.category)}</td><td>${p.stock}</td><td><span class="badge ${statusOf(p)}">${statusLabel(statusOf(p))}</span></td>`;
        priority.append(tr);
    });

    if (!priority.children.length) priority.innerHTML = '<tr><td colspan="4">No hay alertas de stock.</td></tr>';

    const last = moves.slice(0, 7).reverse();
    const data = last.map(m => ({
        label: new Date(m.date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
        in: m.type === "in" ? m.quantity : 0,
        out: m.type === "out" ? m.quantity : 0
    }));
    drawBars("movement-chart", data);
}

function drawDonut(id, legendId, values) {
    const c = document.getElementById(id), ctx = prepare(c);
    const entries = Object.entries(values), total = entries.reduce((s, x) => s + x[1], 0);
    ctx.clearRect(0, 0, c.width, c.height);

    if (!total) {
        ctx.fillStyle = "#718096";
        ctx.font = "14px sans-serif";
        ctx.fillText("Sin productos", 20, 50);
        return;
    }

    let a = -Math.PI / 2;
    entries.forEach(([label, value], i) => {
        const b = a + 2 * Math.PI * value / total;
        ctx.beginPath();
        ctx.arc(c.width / 2, c.height / 2, Math.min(c.height, c.width) * .35, a, b);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = Math.min(c.height, c.width) * .16;
        ctx.stroke();
        a = b;
    });

    const legend = document.getElementById(legendId);
    legend.replaceChildren();

    entries.forEach(([label, value], i) => {
        const span = document.createElement("span");
        span.innerHTML = `<i class="swatch" style="background:${colors[i % colors.length]}"></i>${escapeHTML(label)} (${value})`;
        legend.append(span);
    });
}

function drawBars(id, data) {
    const c = document.getElementById(id), ctx = prepare(c);
    ctx.clearRect(0, 0, c.width, c.height);
    const max = Math.max(1, ...data.flatMap(x => [x.in, x.out]));
    const pad = 28, w = c.width - 2 * pad, h = c.height - 2 * pad, n = Math.max(data.length, 1);
    const step = w / n, bw = Math.min(15, step * .28);

    ctx.font = "11px sans-serif";
    data.forEach((d, i) => {
        const x = pad + i * step + step / 2;
        [[d.in, "#16a36a", -bw - 2], [d.out, "#ef6461", 2]].forEach(([v, color, offset]) => {
            const bh = h * v / max;
            ctx.fillStyle = color;
            ctx.fillRect(x + offset, c.height - pad - bh, bw, bh);
        });
        ctx.fillStyle = "#718096";
        ctx.textAlign = "center";
        ctx.fillText(d.label, x, c.height - 7);
    });

    ctx.fillStyle = "#16a36a";
    ctx.fillRect(pad, 7, 8, 8);
    ctx.fillStyle = "#68788f";
    ctx.textAlign = "left";
    ctx.fillText("Entrada", pad + 12, 15);
    ctx.fillStyle = "#ef6461";
    ctx.fillRect(pad + 75, 7, 8, 8);
    ctx.fillStyle = "#68788f";
    ctx.fillText("Salida", pad + 87, 15);
}

function prepare(c) {
    const w = Math.max(240, c.clientWidth), h = 200;
    c.width = w;
    c.height = h;
    c.style.height = `${h}px`;
    return c.getContext("2d");
}

function statusLabel(s) {
    return s === "empty" ? "Agotado" : s === "low" ? "Stock bajo" : "Disponible";
}

function escapeHTML(s = "") {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}