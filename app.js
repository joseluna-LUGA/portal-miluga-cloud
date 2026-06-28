import { SUPABASE_CONFIG } from "./supabase-config.js?v=20260528-clientes";

const COMPANY = {
  name: "MANTENIMIENTO INTEGRAL LUGA S.A. DE C.V.",
  rfc: "MIL240703K11",
  phone: "3333011961",
  email: "joseluna@miluga.com.mx",
  partnerPhone: "3322561457",
  partnerEmail: "ing.masgauna@miluga.com.mx",
  address: "Guadalajara, Jalisco, Mexico",
  currency: "MXN",
  taxRate: 0.16,
};

const FISCAL_REGIMES = [
  ["601", "General de Ley Personas Morales"],
  ["603", "Personas Morales con Fines no Lucrativos"],
  ["605", "Sueldos y Salarios e Ingresos Asimilados a Salarios"],
  ["606", "Arrendamiento"],
  ["607", "Regimen de Enajenacion o Adquisicion de Bienes"],
  ["608", "Demas ingresos"],
  ["610", "Residentes en el Extranjero sin Establecimiento Permanente en Mexico"],
  ["611", "Ingresos por Dividendos (socios y accionistas)"],
  ["612", "Personas Fisicas con Actividades Empresariales y Profesionales"],
  ["614", "Ingresos por intereses"],
  ["615", "Regimen de los ingresos por obtencion de premios"],
  ["616", "Sin obligaciones fiscales"],
  ["620", "Sociedades Cooperativas de Produccion que optan por diferir sus ingresos"],
  ["621", "Incorporacion Fiscal"],
  ["622", "Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras"],
  ["623", "Opcional para Grupos de Sociedades"],
  ["624", "Coordinados"],
  ["625", "Regimen de las Actividades Empresariales con ingresos a traves de Plataformas Tecnologicas"],
  ["626", "Regimen Simplificado de Confianza"],
  ["628", "Hidrocarburos"],
  ["629", "De los Regimenes Fiscales Preferentes y de las Empresas Multinacionales"],
  ["630", "Enajenacion de acciones en bolsa de valores"],
];

const PAYROLL_TYPES = [
  ["O", "Ordinaria"],
  ["E", "Extraordinaria"],
];

const PAYROLL_FREQUENCIES = [
  ["01", "Diario"],
  ["02", "Semanal"],
  ["03", "Catorcenal"],
  ["04", "Quincenal"],
  ["05", "Mensual"],
  ["99", "Otra periodicidad"],
];

const CONTRACT_TYPES = [
  ["01", "Contrato de trabajo por tiempo indeterminado"],
  ["02", "Contrato de trabajo para obra determinada"],
  ["03", "Contrato de trabajo por tiempo determinado"],
  ["04", "Contrato de trabajo por temporada"],
  ["09", "Modalidades de contratacion"],
  ["10", "Jubilacion, pension, retiro"],
  ["99", "Otro contrato"],
];

const WORKDAY_TYPES = [
  ["01", "Diurna"],
  ["02", "Nocturna"],
  ["03", "Mixta"],
  ["04", "Por hora"],
  ["05", "Reducida"],
  ["06", "Continuada"],
  ["07", "Partida"],
  ["08", "Por turnos"],
  ["99", "Otra jornada"],
];

const EMPLOYEE_REGIMES = [
  ["02", "Sueldos"],
  ["03", "Jubilados"],
  ["04", "Pensionados"],
  ["05", "Asimilados miembros sociedades cooperativas"],
  ["06", "Asimilados integrantes sociedades y asociaciones civiles"],
  ["07", "Asimilados miembros consejos"],
  ["08", "Asimilados comisionistas"],
  ["09", "Asimilados honorarios"],
  ["10", "Asimilados acciones"],
  ["11", "Asimilados otros"],
  ["99", "Otro regimen"],
];

const JOB_RISK_CLASSES = [
  ["1", "Clase I"],
  ["2", "Clase II"],
  ["3", "Clase III"],
  ["4", "Clase IV"],
  ["5", "Clase V"],
  ["99", "No aplica"],
];

const LOCAL_KEY = "miluga_cloud_demo_v1";
const app = document.querySelector("#app");

const state = {
  supabase: null,
  session: null,
  profile: null,
  isAdmin: false,
  cloudReady: false,
  tab: "dashboard",
  data: {
    clients: [],
    quotes: [],
    quoteItems: [],
    orders: [],
    invoices: [],
    payrollEmployees: [],
    payrollReceipts: [],
    users: [],
  },
};

boot();

async function boot() {
  state.cloudReady = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
  if (state.cloudReady) {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      state.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      const { data } = await state.supabase.auth.getSession();
      state.session = data.session;
      state.supabase.auth.onAuthStateChange(async (_event, session) => {
        state.session = session;
        if (!session) {
          state.profile = null;
          state.isAdmin = false;
          state.data.users = [];
        }
        if (session) await loadCloudData();
        render();
      });
      if (state.session) await loadCloudData();
    } catch (error) {
      console.warn("Supabase no pudo cargar; usando modo local.", error);
      state.cloudReady = false;
      loadLocalData();
    }
  } else {
    loadLocalData();
  }
  render();
}

function render() {
  if (state.cloudReady && !state.session) {
    renderLogin();
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <img src="./assets/logo-luga.jpeg" alt="MILUGA">
          <div>
            <strong>Portal MILUGA</strong>
            <span>${state.cloudReady ? "Cloud conectado" : "Modo maqueta local"}</span>
          </div>
        </div>
        <nav class="nav">
          ${navButton("dashboard", "Panel")}
          ${navButton("clients", "Clientes")}
          ${navButton("quotes", "Cotizador")}
          ${navButton("orders", "Ordenes")}
          ${navButton("invoices", "Facturas")}
          ${navButton("payroll", "Nominas")}
          ${state.isAdmin ? navButton("users", "Usuarios") : ""}
          ${navButton("settings", "Configuracion")}
        </nav>
        <div class="sidebar-footer">
          <small>${state.cloudReady ? escapeHtml(state.session?.user?.email || "") : "Configura Supabase para login real"}</small>
          ${state.cloudReady ? `<button class="ghost full" data-action="logout">Salir</button>` : ""}
        </div>
      </aside>
      <main class="main">
        ${renderHeader()}
        <section class="content">${renderTab()}</section>
      </main>
    </div>
  `;
  bindEvents();
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card">
        <img src="./assets/logo-luga.jpeg" alt="MILUGA" class="login-logo">
        <p class="eyebrow">Portal MILUGA Cloud</p>
        <h1>Acceso seguro</h1>
        <p class="muted">Entra con tu usuario de Supabase para usar Cotizador, Ordenes y Facturas desde cualquier lugar.</p>
        <form id="login-form" class="stack">
          <label>Correo<input name="email" type="email" required autocomplete="email"></label>
          <label>Contrasena<input name="password" type="password" required autocomplete="current-password"></label>
          <button class="primary" type="submit">Entrar</button>
        </form>
        <p id="login-message" class="message"></p>
      </section>
    </main>
  `;
  document.querySelector("#login-form").addEventListener("submit", handleLogin);
}

function renderHeader() {
  const titles = {
    dashboard: "Panel general",
    clients: "Clientes",
    quotes: "Cotizador",
    orders: "Ordenes de servicio",
    invoices: "Facturas",
    payroll: "Nominas",
    users: "Usuarios",
    settings: "Configuracion",
  };
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Mantenimiento Integral Luga</p>
        <h1>${titles[state.tab]}</h1>
      </div>
      <div class="company-pill">${COMPANY.rfc}</div>
    </header>
  `;
}

function navButton(tab, label) {
  return `<button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`;
}

function fiscalRegimeSelect(name, selected = "", options = {}) {
  const selectedValue = String(selected || options.defaultValue || "");
  const required = options.required ? " required" : "";
  const placeholder = options.placeholder || "Selecciona regimen";
  const hasStoredValue = selectedValue && !FISCAL_REGIMES.some(([code]) => code === selectedValue);
  return `
    <select name="${escapeHtml(name)}"${required}>
      <option value="">${escapeHtml(placeholder)}</option>
      ${hasStoredValue ? `<option value="${escapeHtml(selectedValue)}" selected>${escapeHtml(selectedValue)}</option>` : ""}
      ${FISCAL_REGIMES.map(([code, label]) => `
        <option value="${code}" ${selectedValue === code ? "selected" : ""}>${code} - ${escapeHtml(label)}</option>
      `).join("")}
    </select>
  `;
}

function catalogSelect(name, catalog, selected = "", options = {}) {
  const selectedValue = String(selected || options.defaultValue || "");
  const required = options.required ? " required" : "";
  const placeholder = options.placeholder || "Selecciona opcion";
  const hasStoredValue = selectedValue && !catalog.some(([code]) => code === selectedValue);
  return `
    <select name="${escapeHtml(name)}"${required}>
      <option value="">${escapeHtml(placeholder)}</option>
      ${hasStoredValue ? `<option value="${escapeHtml(selectedValue)}" selected>${escapeHtml(selectedValue)}</option>` : ""}
      ${catalog.map(([code, label]) => `
        <option value="${code}" ${selectedValue === code ? "selected" : ""}>${code} - ${escapeHtml(label)}</option>
      `).join("")}
    </select>
  `;
}

function renderTab() {
  if (state.tab === "clients") return renderClients();
  if (state.tab === "quotes") return renderQuotes();
  if (state.tab === "orders") return renderOrders();
  if (state.tab === "invoices") return renderInvoices();
  if (state.tab === "payroll") return renderPayroll();
  if (state.tab === "users") return state.isAdmin ? renderUsers() : renderDashboard();
  if (state.tab === "settings") return renderSettings();
  return renderDashboard();
}

function renderDashboard() {
  return `
    <div class="metric-grid">
      ${metric("Clientes", state.data.clients.length)}
      ${metric("Cotizaciones", state.data.quotes.length)}
      ${metric("Ordenes", state.data.orders.length)}
      ${metric("Facturas", state.data.invoices.length)}
      ${metric("Nominas", state.data.payrollReceipts.length)}
    </div>
    <div class="two-col">
      <section class="panel">
        <h2>Flujo del portal</h2>
        <div class="timeline">
          <span>1. Captura cliente</span>
          <span>2. Genera cotizacion u orden</span>
          <span>3. Imprime / guarda PDF</span>
          <span>4. Prepara factura CFDI o recibo de nomina</span>
        </div>
      </section>
      <section class="panel">
        <h2>Estado de nube</h2>
        <p>${state.cloudReady ? "Supabase esta configurado. Los datos se guardan en la nube para tu usuario." : "Aun no hay llaves de Supabase. La app esta trabajando en modo local de prueba."}</p>
        <button class="secondary" data-tab="settings">Ver configuracion</button>
      </section>
    </div>
    <section class="panel">
      <h2>Ultimos movimientos</h2>
      ${renderRecentList()}
    </section>
  `;
}

function metric(label, value) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function renderRecentList() {
  const records = [
    ...state.data.quotes.map((item) => ({ type: "Cotizacion", folio: item.folio, name: item.client_name, date: item.created_at })),
    ...state.data.orders.map((item) => ({ type: "Orden", folio: item.folio, name: item.client_name, date: item.created_at })),
    ...state.data.invoices.map((item) => ({ type: "Factura", folio: item.folio, name: item.receiver_name, date: item.created_at })),
    ...state.data.payrollReceipts.map((item) => ({ type: "Nomina", folio: item.folio, name: item.employee_name, date: item.created_at })),
  ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 8);

  if (!records.length) return `<p class="muted">Todavia no hay movimientos guardados.</p>`;
  return `<div class="record-list">${records.map((item) => `
    <div class="record-row">
      <strong>${escapeHtml(item.folio)}</strong>
      <span>${escapeHtml(item.type)}</span>
      <span>${escapeHtml(item.name || "")}</span>
    </div>`).join("")}</div>`;
}

function renderClients() {
  return `
    <section class="panel">
      <h2>Nuevo cliente</h2>
      <form id="client-form" class="grid">
        <label>Cliente o empresa<input name="name" required></label>
        <label>RFC<input name="rfc"></label>
        <label>Correo<input name="email" type="email"></label>
        <label>Telefono<input name="phone"></label>
        <label>Codigo postal fiscal<input name="fiscal_zip"></label>
        <label>Regimen fiscal${fiscalRegimeSelect("regime")}</label>
        <label class="wide">Direccion<textarea name="address" rows="3"></textarea></label>
        <button class="primary" type="submit">Guardar cliente</button>
      </form>
    </section>
    <section class="panel">
      <h2>Clientes guardados</h2>
      ${state.data.clients.length ? `<div class="record-list">${state.data.clients.map(renderClientRow).join("")}</div>` : `<p class="muted">Sin clientes guardados.</p>`}
    </section>
  `;
}

function renderClientRow(client) {
  return `
    <div class="record-row">
      <strong>${escapeHtml(client.name)}</strong>
      <span>${escapeHtml(client.rfc || "Sin RFC")}</span>
      <span>${escapeHtml(client.email || "")}</span>
    </div>
  `;
}

function renderQuotes() {
  return `
    <section class="panel">
      <div class="section-title">
        <h2>Nueva cotizacion</h2>
        <button class="secondary" data-action="load-imss-quote">Cargar cotizacion recuperada</button>
      </div>
      <form id="quote-form" class="stack">
        <div class="grid">
          <label>Cliente o empresa<input name="client_name" required list="clients-list" autocomplete="off"></label>
          <label>RFC<input name="client_rfc"></label>
          <label>Correo<input name="client_email" type="email"></label>
          <label>Proyecto o servicio<input name="project_name" required></label>
        </div>
        ${clientDatalist()}
        <div class="table-wrap">
          <table class="edit-table" id="quote-items">
            <thead><tr><th>Descripcion</th><th>Cantidad</th><th>Precio unitario</th><th></th></tr></thead>
            <tbody>${quoteItemRow()}</tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary" type="button" data-action="add-quote-item">Agregar concepto</button>
          <button class="primary" type="submit">Guardar cotizacion</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <h2>Cotizaciones guardadas</h2>
      ${renderDocumentList(state.data.quotes, "quote")}
    </section>
  `;
}

function quoteItemRow(item = {}) {
  return `
    <tr>
      <td><textarea name="description" rows="3" required>${escapeHtml(item.description || "")}</textarea></td>
      <td><input name="quantity" type="number" step="0.01" value="${escapeHtml(String(item.quantity ?? 1))}" required></td>
      <td><input name="unit_price" type="number" step="0.01" value="${escapeHtml(String(item.unit_price ?? 0))}" required></td>
      <td><button class="ghost" type="button" data-action="remove-row">Quitar</button></td>
    </tr>
  `;
}

function renderOrders() {
  return `
    <section class="panel">
      <h2>Nueva orden de servicio</h2>
      <form id="order-form" class="stack">
        <div class="grid">
          <label>Cliente<input name="client_name" required list="clients-list" autocomplete="off"></label>
          <label>RFC<input name="client_rfc"></label>
          <label>Correo<input name="client_email" type="email"></label>
          <label>Telefono<input name="client_phone"></label>
          <label>Fecha del servicio<input name="service_date" type="date"></label>
          <label>Tecnico / responsable<input name="technician_name"></label>
          <label class="wide">Ubicacion<textarea name="service_location" rows="3"></textarea></label>
          <label class="wide">Trabajos realizados<textarea name="work_description" rows="5"></textarea></label>
          <label class="wide">Observaciones<textarea name="observations" rows="4"></textarea></label>
          <label>Recibe<input name="receiver_name"></label>
          <label>Puesto / area<input name="receiver_role"></label>
        </div>
        ${clientDatalist()}
        <div class="table-wrap">
          <table class="edit-table" id="order-items">
            <thead><tr><th>Descripcion</th><th>Cantidad</th><th>Unidad</th><th>Observacion</th><th></th></tr></thead>
            <tbody>${orderItemRow()}</tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary" type="button" data-action="add-order-item">Agregar renglon</button>
          <button class="primary" type="submit">Guardar orden</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <h2>Ordenes guardadas</h2>
      ${renderDocumentList(state.data.orders, "order")}
    </section>
  `;
}

function orderItemRow(item = {}) {
  return `
    <tr>
      <td><input name="description" value="${escapeHtml(item.description || "")}"></td>
      <td><input name="quantity" value="${escapeHtml(item.quantity || "1")}"></td>
      <td><input name="unit" value="${escapeHtml(item.unit || "pz")}"></td>
      <td><input name="note" value="${escapeHtml(item.note || "")}"></td>
      <td><button class="ghost" type="button" data-action="remove-row">Quitar</button></td>
    </tr>
  `;
}

function renderInvoices() {
  return `
    <section class="panel warning">
      <strong>Nota fiscal</strong>
      <p>Esta seccion prepara borradores y XML preliminar. El timbrado real debe hacerse desde backend con secretos seguros del PAC y CSD.</p>
    </section>
    <section class="panel">
      <h2>Nueva factura</h2>
      <form id="invoice-form" class="stack">
        <div class="grid">
          <label>RFC receptor<input name="receiver_rfc" required></label>
          <label>Nombre receptor<input name="receiver_name" required list="clients-list" autocomplete="off"></label>
          <label>Correo receptor<input name="receiver_email" type="email"></label>
          <label>Regimen receptor${fiscalRegimeSelect("receiver_regime", "601", { required: true })}</label>
          <label>CP fiscal<input name="receiver_zip"></label>
          <label>Uso CFDI<input name="cfdi_use" value="G03"></label>
          <label>Metodo de pago<input name="payment_method" value="PUE"></label>
          <label>Forma de pago<input name="payment_form" value="03"></label>
        </div>
        ${clientDatalist()}
        <div class="table-wrap">
          <table class="edit-table" id="invoice-items">
            <thead><tr><th>Clave SAT</th><th>Descripcion</th><th>Cantidad</th><th>Precio</th><th>IVA %</th><th></th></tr></thead>
            <tbody>${invoiceItemRow()}</tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary" type="button" data-action="add-invoice-item">Agregar concepto</button>
          <button class="primary" type="submit">Guardar factura</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <h2>Facturas guardadas</h2>
      ${renderDocumentList(state.data.invoices, "invoice")}
    </section>
  `;
}

function invoiceItemRow(item = {}) {
  return `
    <tr>
      <td><input name="sat_code" value="${escapeHtml(item.sat_code || "72101500")}"></td>
      <td><input name="description" value="${escapeHtml(item.description || "")}"></td>
      <td><input name="quantity" type="number" step="0.01" value="${escapeHtml(String(item.quantity ?? 1))}"></td>
      <td><input name="unit_price" type="number" step="0.01" value="${escapeHtml(String(item.unit_price ?? 0))}"></td>
      <td><input name="tax_rate" type="number" step="0.01" value="${escapeHtml(String(item.tax_rate ?? 16))}"></td>
      <td><button class="ghost" type="button" data-action="remove-row">Quitar</button></td>
    </tr>
  `;
}

function renderPayroll() {
  return `
    <section class="panel warning">
      <strong>Nomina pre-timbrado</strong>
      <p>Este modulo prepara empleados, recibos, PDF imprimible y XML preliminar. El sellado con CSD y timbrado PAC se conectan despues desde backend seguro.</p>
    </section>
    <section class="panel">
      <h2>Nuevo empleado</h2>
      <form id="payroll-employee-form" class="grid">
        <label>Numero empleado<input name="employee_number" required></label>
        <label>Nombre completo<input name="full_name" required></label>
        <label>RFC<input name="rfc" required></label>
        <label>CURP<input name="curp" required></label>
        <label>NSS<input name="nss"></label>
        <label>Correo<input name="email" type="email"></label>
        <label>Telefono<input name="phone"></label>
        <label>CP fiscal<input name="fiscal_zip"></label>
        <label>Fecha ingreso<input name="start_date" type="date"></label>
        <label>Departamento<input name="department"></label>
        <label>Puesto<input name="position"></label>
        <label>Tipo contrato${catalogSelect("contract_type", CONTRACT_TYPES, "01", { required: true })}</label>
        <label>Tipo jornada${catalogSelect("workday_type", WORKDAY_TYPES, "01")}</label>
        <label>Regimen empleado${catalogSelect("employee_regime", EMPLOYEE_REGIMES, "02", { required: true })}</label>
        <label>Periodicidad${catalogSelect("payment_frequency", PAYROLL_FREQUENCIES, "04", { required: true })}</label>
        <label>Riesgo puesto${catalogSelect("risk_class", JOB_RISK_CLASSES, "1")}</label>
        <label>Salario diario<input name="daily_salary" type="number" step="0.01" value="0"></label>
        <label>Salario base cotizacion<input name="base_salary" type="number" step="0.01" value="0"></label>
        <button class="primary" type="submit">Guardar empleado</button>
      </form>
    </section>
    <section class="panel">
      <h2>Empleados guardados</h2>
      ${state.data.payrollEmployees.length ? `<div class="record-list">${state.data.payrollEmployees.map(renderPayrollEmployeeRow).join("")}</div>` : `<p class="muted">Sin empleados guardados.</p>`}
    </section>
    <section class="panel">
      <h2>Nuevo recibo de nomina</h2>
      <form id="payroll-form" class="stack">
        <div class="grid">
          <input name="employee_id" type="hidden">
          <label>Empleado<input name="employee_name" required list="payroll-employees-list" autocomplete="off"></label>
          <label>RFC<input name="employee_rfc" required></label>
          <label>CURP<input name="employee_curp" required></label>
          <label>NSS<input name="employee_nss"></label>
          <label>Fecha pago<input name="payment_date" type="date" required></label>
          <label>Periodo inicio<input name="period_start" type="date" required></label>
          <label>Periodo fin<input name="period_end" type="date" required></label>
          <label>Dias pagados<input name="paid_days" type="number" step="0.001" value="15" required></label>
          <label>Tipo nomina${catalogSelect("payroll_type", PAYROLL_TYPES, "O", { required: true })}</label>
          <label>Periodicidad${catalogSelect("payment_frequency", PAYROLL_FREQUENCIES, "04", { required: true })}</label>
          <label>Tipo contrato${catalogSelect("contract_type", CONTRACT_TYPES, "01")}</label>
          <label>Regimen empleado${catalogSelect("employee_regime", EMPLOYEE_REGIMES, "02")}</label>
          <label>Departamento<input name="department"></label>
          <label>Puesto<input name="position"></label>
          <label>Salario diario<input name="daily_salary" type="number" step="0.01" value="0"></label>
          <label>Salario base cotizacion<input name="base_salary" type="number" step="0.01" value="0"></label>
        </div>
        ${payrollEmployeeDatalist()}
        <div class="table-wrap">
          <table class="edit-table" id="payroll-perceptions">
            <thead><tr><th>Tipo SAT</th><th>Concepto</th><th>Gravado</th><th>Exento</th><th></th></tr></thead>
            <tbody>${payrollPerceptionRow()}</tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary" type="button" data-action="add-payroll-perception">Agregar percepcion</button>
        </div>
        <div class="table-wrap">
          <table class="edit-table" id="payroll-deductions">
            <thead><tr><th>Tipo SAT</th><th>Concepto</th><th>Importe</th><th></th></tr></thead>
            <tbody>${payrollDeductionRow()}</tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary" type="button" data-action="add-payroll-deduction">Agregar deduccion</button>
          <button class="primary" type="submit">Guardar recibo</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <h2>Recibos guardados</h2>
      ${renderDocumentList(state.data.payrollReceipts, "payroll")}
    </section>
  `;
}

function renderPayrollEmployeeRow(employee) {
  return `
    <div class="record-row">
      <strong>${escapeHtml(employee.employee_number || "")}</strong>
      <span>${escapeHtml(employee.full_name || "")}</span>
      <span>${escapeHtml(employee.rfc || "")}</span>
      <span>${escapeHtml(employee.position || employee.department || "")}</span>
    </div>
  `;
}

function payrollPerceptionRow(item = {}) {
  return `
    <tr>
      <td><input name="type" value="${escapeHtml(item.type || "001")}" required></td>
      <td><input name="description" value="${escapeHtml(item.description || "Sueldos, salarios rayas y jornales")}" required></td>
      <td><input name="taxable_amount" type="number" step="0.01" value="${escapeHtml(String(item.taxable_amount ?? 0))}" required></td>
      <td><input name="exempt_amount" type="number" step="0.01" value="${escapeHtml(String(item.exempt_amount ?? 0))}" required></td>
      <td><button class="ghost" type="button" data-action="remove-row">Quitar</button></td>
    </tr>
  `;
}

function payrollDeductionRow(item = {}) {
  return `
    <tr>
      <td><input name="type" value="${escapeHtml(item.type || "002")}" required></td>
      <td><input name="description" value="${escapeHtml(item.description || "ISR")}" required></td>
      <td><input name="amount" type="number" step="0.01" value="${escapeHtml(String(item.amount ?? 0))}" required></td>
      <td><button class="ghost" type="button" data-action="remove-row">Quitar</button></td>
    </tr>
  `;
}

function renderSettings() {
  return `
    <section class="panel">
      <h2>Conexion Supabase</h2>
      <p>${state.cloudReady ? "Este portal ya tiene URL y llave publica configuradas." : "Falta configurar `supabase-config.js` con la URL y la llave publica/anon de tu proyecto Supabase."}</p>
      <pre class="code">export const SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_SUPABASE_ANON_O_PUBLISHABLE_KEY",
};</pre>
    </section>
    <section class="panel">
      <h2>Empresa</h2>
      <div class="company-summary">
        <strong>${COMPANY.name}</strong>
        <span>RFC: ${COMPANY.rfc}</span>
        <span>${COMPANY.email} / ${COMPANY.partnerEmail}</span>
        <span>${COMPANY.address}</span>
      </div>
    </section>
    <section class="panel">
      <h2>Correos</h2>
      <p>Las cotizaciones y ordenes se envian desde Supabase con el remitente no-reply@miluga.com.mx. La llave privada del proveedor de correo debe estar guardada como secreto de Supabase.</p>
    </section>
    <section class="panel warning">
      <h2>Seguridad</h2>
      <p>No pongas claves privadas CSD, passwords PAC, Gmail tokens ni service_role key en archivos publicos. Eso va en backend o secretos del proveedor.</p>
    </section>
  `;
}

function renderUsers() {
  return `
    <section class="panel">
      <h2>Nuevo usuario</h2>
      <form id="user-form" class="grid">
        <label>Nombre<input name="full_name" autocomplete="name"></label>
        <label>Correo<input name="email" type="email" required autocomplete="off"></label>
        <label>Contrasena<input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
        <label>Rol
          <select name="role">
            <option value="staff">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <button class="primary" type="submit">Crear usuario</button>
        <p id="user-message" class="message"></p>
      </form>
    </section>
    <section class="panel">
      <h2>Usuarios guardados</h2>
      ${state.data.users.length ? `<div class="record-list">${state.data.users.map(renderUserRow).join("")}</div>` : `<p class="muted">Sin usuarios registrados.</p>`}
    </section>
  `;
}

function renderUserRow(user) {
  return `
    <div class="record-row user-row">
      <strong>${escapeHtml(user.email)}</strong>
      <span>${escapeHtml(user.full_name || "")}</span>
      <span>${roleLabel(user.role)}</span>
      <span>${user.active ? "Activo" : "Inactivo"}</span>
    </div>
  `;
}

function renderDocumentList(records, kind) {
  const canEmail = ["quote", "order"].includes(kind);
  if (!records.length) return `<p class="muted">Sin registros guardados.</p>`;
  return `<div class="record-list">${records.map((item) => `
    <div class="record-row">
      <strong>${escapeHtml(item.folio || "")}</strong>
      <span>${escapeHtml(item.client_name || item.receiver_name || item.employee_name || "")}</span>
      <span>${formatMoney(item.total ?? item.net_total ?? 0)}</span>
      <div class="record-actions">
        ${canEmail ? emailButton(kind, item) : ""}
        <button class="ghost" data-print="${kind}" data-id="${item.id}">Imprimir</button>
      </div>
    </div>
  `).join("")}</div>`;
}

function emailButton(kind, item) {
  const email = String(item.client_email || "").trim();
  const title = email ? `Enviar a ${email}` : "Este registro no tiene correo de cliente";
  return `<button class="secondary email-action" data-email="${kind}" data-id="${item.id}" title="${escapeHtml(title)}" ${email ? "" : "disabled"}>Enviar por correo</button>`;
}

function clientDatalist() {
  return `<datalist id="clients-list">${state.data.clients.map((client) => `<option value="${escapeHtml(client.name)}">${escapeHtml(client.rfc || "")}</option>`).join("")}</datalist>`;
}

function payrollEmployeeDatalist() {
  return `<datalist id="payroll-employees-list">${state.data.payrollEmployees.map((employee) => `<option value="${escapeHtml(employee.full_name)}">${escapeHtml(employee.rfc || "")}</option>`).join("")}</datalist>`;
}

function bindEvents() {
  app.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      render();
    });
  });

  app.querySelector('[data-action="logout"]')?.addEventListener("click", async () => {
    await state.supabase.auth.signOut();
  });

  app.querySelector("#client-form")?.addEventListener("submit", saveClient);
  app.querySelector("#quote-form")?.addEventListener("submit", saveQuote);
  app.querySelector("#order-form")?.addEventListener("submit", saveOrder);
  app.querySelector("#invoice-form")?.addEventListener("submit", saveInvoice);
  app.querySelector("#payroll-employee-form")?.addEventListener("submit", savePayrollEmployee);
  app.querySelector("#payroll-form")?.addEventListener("submit", savePayrollReceipt);
  app.querySelector("#user-form")?.addEventListener("submit", createPortalUser);
  bindClientAutofill();
  bindPayrollAutofill();

  app.querySelector('[data-action="add-quote-item"]')?.addEventListener("click", () => {
    const body = document.querySelector("#quote-items tbody");
    body.insertAdjacentHTML("beforeend", quoteItemRow());
    bindRowRemoveButtons(body);
  });
  app.querySelector('[data-action="add-order-item"]')?.addEventListener("click", () => {
    const body = document.querySelector("#order-items tbody");
    body.insertAdjacentHTML("beforeend", orderItemRow());
    bindRowRemoveButtons(body);
  });
  app.querySelector('[data-action="add-invoice-item"]')?.addEventListener("click", () => {
    const body = document.querySelector("#invoice-items tbody");
    body.insertAdjacentHTML("beforeend", invoiceItemRow());
    bindRowRemoveButtons(body);
  });
  app.querySelector('[data-action="add-payroll-perception"]')?.addEventListener("click", () => {
    const body = document.querySelector("#payroll-perceptions tbody");
    body.insertAdjacentHTML("beforeend", payrollPerceptionRow({ description: "", type: "" }));
    bindRowRemoveButtons(body);
  });
  app.querySelector('[data-action="add-payroll-deduction"]')?.addEventListener("click", () => {
    const body = document.querySelector("#payroll-deductions tbody");
    body.insertAdjacentHTML("beforeend", payrollDeductionRow({ description: "", type: "" }));
    bindRowRemoveButtons(body);
  });
  app.querySelector('[data-action="load-imss-quote"]')?.addEventListener("click", loadRecoveredQuote);

  app.querySelectorAll('[data-action="remove-row"]').forEach((button) => {
    button.addEventListener("click", () => button.closest("tr")?.remove());
  });

  app.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => printRecord(button.dataset.print, button.dataset.id));
  });

  app.querySelectorAll("[data-email]").forEach((button) => {
    button.addEventListener("click", () => sendDocumentEmail(button.dataset.email, button.dataset.id, button));
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const message = document.querySelector("#login-message");
  const { error } = await state.supabase.auth.signInWithPassword({
    email: form.get("email"),
    password: form.get("password"),
  });
  message.textContent = error ? error.message : "Entrando...";
}

async function handleSignup() {
  const form = new FormData(document.querySelector("#login-form"));
  const message = document.querySelector("#login-message");
  const email = form.get("email");
  const password = form.get("password");
  if (!email || !password) {
    message.textContent = "Captura correo y contrasena para crear el usuario.";
    return;
  }
  const { error } = await state.supabase.auth.signUp({ email, password });
  message.textContent = error ? error.message : "Usuario creado. Revisa tu correo si Supabase pide confirmacion.";
}

async function createPortalUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#user-message");
  const payload = formObject(form);
  message.textContent = "Creando usuario...";

  const { data, error } = await state.supabase.functions.invoke("admin-users", {
    body: payload,
    headers: {
      Authorization: `Bearer ${state.session?.access_token || ""}`,
    },
  });

  if (error || data?.error) {
    message.textContent = data?.error || error?.message || "No se pudo crear el usuario.";
    return;
  }

  message.textContent = "Usuario creado.";
  form.reset();
  await loadCloudData();
  render();
}

async function sendDocumentEmail(kind, id, button) {
  if (!state.cloudReady || !state.session) {
    alert("Inicia sesion en Supabase para enviar correos.");
    return;
  }

  const collection = kind === "quote" ? state.data.quotes : kind === "order" ? state.data.orders : [];
  const record = collection.find((item) => item.id === id);
  if (!record) {
    alert("No encontre este documento guardado.");
    return;
  }

  const email = String(record.client_email || "").trim();
  if (!email) {
    alert("Este documento no tiene correo de cliente.");
    return;
  }

  const label = kind === "quote" ? "cotizacion" : "orden";
  if (!window.confirm(`Enviar ${label} ${record.folio || ""} a ${email}?`)) return;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Enviando...";

  try {
    const { data, error } = await state.supabase.functions.invoke("send-document-email", {
      body: { kind, id },
      headers: {
        Authorization: `Bearer ${state.session?.access_token || ""}`,
      },
    });

    if (error || data?.error) {
      throw new Error(data?.error || error?.message || "No se pudo enviar el correo.");
    }

    alert(`Correo enviado a ${data?.sentTo || email}.`);
  } catch (error) {
    alert(error?.message || "No se pudo enviar el correo.");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function loadCloudData() {
  await loadProfile();
  const [clients, quotes, quoteItems, orders, invoices, payrollEmployees, payrollReceipts] = await Promise.all([
    state.supabase.from("miluga_clients").select("*").order("created_at", { ascending: false }),
    state.supabase.from("miluga_quotes").select("*").order("created_at", { ascending: false }),
    state.supabase.from("miluga_quote_items").select("*").order("position", { ascending: true }),
    state.supabase.from("miluga_service_orders").select("*").order("created_at", { ascending: false }),
    state.supabase.from("miluga_invoices").select("*").order("created_at", { ascending: false }),
    state.supabase.from("miluga_payroll_employees").select("*").order("created_at", { ascending: false }),
    state.supabase.from("miluga_payroll_receipts").select("*").order("created_at", { ascending: false }),
  ]);
  state.data.clients = clients.data || [];
  state.data.quotes = quotes.data || [];
  state.data.quoteItems = quoteItems.data || [];
  state.data.orders = orders.data || [];
  state.data.invoices = invoices.data || [];
  state.data.payrollEmployees = payrollEmployees.data || [];
  state.data.payrollReceipts = payrollReceipts.data || [];
}

async function loadProfile() {
  state.profile = null;
  state.isAdmin = false;
  state.data.users = [];
  if (!state.session?.user?.id) return;

  const { data, error } = await state.supabase
    .from("miluga_profiles")
    .select("id, email, full_name, role, active")
    .eq("id", state.session.user.id)
    .maybeSingle();

  if (error) {
    console.warn("No se pudo cargar el perfil MILUGA.", error);
    return;
  }

  state.profile = data;
  state.isAdmin = Boolean(data?.active && ["owner", "admin"].includes(data.role));

  if (state.isAdmin) {
    const users = await state.supabase
      .from("miluga_profiles")
      .select("id, email, full_name, role, active, created_at")
      .order("created_at", { ascending: false });
    state.data.users = users.data || [];
  }
}

function loadLocalData() {
  const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
  state.data = {
    clients: saved.clients || [],
    quotes: saved.quotes || [],
    quoteItems: saved.quoteItems || [],
    orders: saved.orders || [],
    invoices: saved.invoices || [],
    payrollEmployees: saved.payrollEmployees || [],
    payrollReceipts: saved.payrollReceipts || [],
    users: [],
  };
}

function saveLocalData() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state.data));
}

async function saveClient(event) {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  if (state.cloudReady) {
    const { error } = await state.supabase.from("miluga_clients").insert(payload);
    if (error) return alert(error.message);
    await loadCloudData();
  } else {
    state.data.clients.unshift({ ...payload, id: localId(), created_at: new Date().toISOString() });
    saveLocalData();
  }
  state.tab = "clients";
  render();
}

async function saveQuote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const base = formObject(form);
  const items = [...form.querySelectorAll("#quote-items tbody tr")].map((row, index) => {
    const description = row.querySelector('[name="description"]').value.trim();
    const quantity = Number(row.querySelector('[name="quantity"]').value || 0);
    const unit_price = Number(row.querySelector('[name="unit_price"]').value || 0);
    return { description, quantity, unit_price, total: quantity * unit_price, position: index };
  }).filter((item) => item.description);
  if (!items.length) return alert("Agrega al menos un concepto.");
  const subtotal = sum(items.map((item) => item.total));
  const tax = subtotal * COMPANY.taxRate;
  const quote = {
    folio: await nextFolio("quote"),
    client_name: base.client_name,
    client_rfc: base.client_rfc,
    client_email: base.client_email,
    project_name: base.project_name,
    currency: COMPANY.currency,
    tax_rate: COMPANY.taxRate,
    subtotal,
    tax,
    total: subtotal + tax,
    status: "draft",
  };

  if (state.cloudReady) {
    const { data, error } = await state.supabase.from("miluga_quotes").insert(quote).select().single();
    if (error) return alert(error.message);
    const itemRows = items.map((item) => ({ ...item, quote_id: data.id }));
    const itemResult = await state.supabase.from("miluga_quote_items").insert(itemRows);
    if (itemResult.error) return alert(itemResult.error.message);
    await upsertClientFromDocument(base);
    await loadCloudData();
    printQuote(data, itemRows);
  } else {
    const saved = { ...quote, id: localId(), created_at: new Date().toISOString() };
    const savedItems = items.map((item) => ({ ...item, id: localId(), quote_id: saved.id }));
    state.data.quotes.unshift(saved);
    state.data.quoteItems.push(...savedItems);
    upsertLocalClient(base);
    saveLocalData();
    printQuote(saved, savedItems);
  }
  state.tab = "quotes";
  render();
}

async function saveOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const base = formObject(form);
  const materials = [...form.querySelectorAll("#order-items tbody tr")].map((row) => ({
    description: row.querySelector('[name="description"]').value.trim(),
    quantity: row.querySelector('[name="quantity"]').value.trim(),
    unit: row.querySelector('[name="unit"]').value.trim(),
    note: row.querySelector('[name="note"]').value.trim(),
  })).filter((item) => item.description);
  const order = {
    folio: await nextFolio("order"),
    ...base,
    materials,
    status: "draft",
  };
  if (state.cloudReady) {
    const { data, error } = await state.supabase.from("miluga_service_orders").insert(order).select().single();
    if (error) return alert(error.message);
    await upsertClientFromDocument({ client_name: base.client_name, client_rfc: base.client_rfc, client_email: base.client_email });
    await loadCloudData();
    printOrder(data);
  } else {
    const saved = { ...order, id: localId(), created_at: new Date().toISOString() };
    state.data.orders.unshift(saved);
    upsertLocalClient({ client_name: base.client_name, client_rfc: base.client_rfc, client_email: base.client_email });
    saveLocalData();
    printOrder(saved);
  }
  state.tab = "orders";
  render();
}

async function saveInvoice(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const base = formObject(form);
  const items = [...form.querySelectorAll("#invoice-items tbody tr")].map((row) => {
    const quantity = Number(row.querySelector('[name="quantity"]').value || 0);
    const unit_price = Number(row.querySelector('[name="unit_price"]').value || 0);
    const tax_rate = Number(row.querySelector('[name="tax_rate"]').value || 0) / 100;
    const subtotal = quantity * unit_price;
    return {
      sat_code: row.querySelector('[name="sat_code"]').value.trim(),
      description: row.querySelector('[name="description"]').value.trim(),
      quantity,
      unit_price,
      tax_rate,
      total: subtotal + subtotal * tax_rate,
    };
  }).filter((item) => item.description);
  if (!items.length) return alert("Agrega al menos un concepto.");
  const subtotal = sum(items.map((item) => item.quantity * item.unit_price));
  const tax = sum(items.map((item) => item.quantity * item.unit_price * item.tax_rate));
  const invoice = {
    folio: await nextFolio("invoice"),
    ...base,
    currency: COMPANY.currency,
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    xml_preview: buildXmlPreview(base, items, subtotal, tax),
    status: "draft",
  };
  if (state.cloudReady) {
    const { data, error } = await state.supabase.from("miluga_invoices").insert(invoice).select().single();
    if (error) return alert(error.message);
    await loadCloudData();
    printInvoice(data);
  } else {
    const saved = { ...invoice, id: localId(), created_at: new Date().toISOString() };
    state.data.invoices.unshift(saved);
    saveLocalData();
    printInvoice(saved);
  }
  state.tab = "invoices";
  render();
}

async function savePayrollEmployee(event) {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  payload.daily_salary = Number(payload.daily_salary || 0);
  payload.base_salary = Number(payload.base_salary || 0);
  payload.start_date = payload.start_date || null;
  payload.active = true;

  if (state.cloudReady) {
    const { error } = await state.supabase.from("miluga_payroll_employees").insert(payload);
    if (error) return alert(error.message);
    await loadCloudData();
  } else {
    state.data.payrollEmployees.unshift({ ...payload, id: localId(), created_at: new Date().toISOString() });
    saveLocalData();
  }
  state.tab = "payroll";
  render();
}

async function savePayrollReceipt(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const base = formObject(form);
  const employee = findPayrollEmployeeByName(base.employee_name) || {};

  const perceptions = [...form.querySelectorAll("#payroll-perceptions tbody tr")].map((row) => ({
    type: row.querySelector('[name="type"]').value.trim(),
    description: row.querySelector('[name="description"]').value.trim(),
    taxable_amount: Number(row.querySelector('[name="taxable_amount"]').value || 0),
    exempt_amount: Number(row.querySelector('[name="exempt_amount"]').value || 0),
  })).filter((item) => item.type && item.description);
  const deductions = [...form.querySelectorAll("#payroll-deductions tbody tr")].map((row) => ({
    type: row.querySelector('[name="type"]').value.trim(),
    description: row.querySelector('[name="description"]').value.trim(),
    amount: Number(row.querySelector('[name="amount"]').value || 0),
  })).filter((item) => item.type && item.description);

  if (!perceptions.length) return alert("Agrega al menos una percepcion.");

  const totalPerceptions = sum(perceptions.map((item) => item.taxable_amount + item.exempt_amount));
  const totalDeductions = sum(deductions.map((item) => item.amount));
  const receipt = {
    folio: await nextFolio("payroll"),
    employee_id: base.employee_id || employee.id || null,
    employee_number: employee.employee_number || "",
    employee_name: base.employee_name,
    employee_rfc: base.employee_rfc,
    employee_curp: base.employee_curp,
    employee_nss: base.employee_nss,
    employee_regime: base.employee_regime,
    employee_fiscal_zip: employee.fiscal_zip || "",
    period_start: base.period_start,
    period_end: base.period_end,
    payment_date: base.payment_date,
    paid_days: Number(base.paid_days || 0),
    payroll_type: base.payroll_type || "O",
    payment_frequency: base.payment_frequency,
    contract_type: base.contract_type,
    workday_type: employee.workday_type || "",
    department: base.department,
    position: base.position,
    risk_class: employee.risk_class || "",
    start_date: employee.start_date || null,
    daily_salary: Number(base.daily_salary || 0),
    base_salary: Number(base.base_salary || 0),
    perceptions,
    deductions,
    other_payments: [],
    total_perceptions: totalPerceptions,
    total_deductions: totalDeductions,
    total_other_payments: 0,
    net_total: totalPerceptions - totalDeductions,
    status: "pre_timbrado",
  };
  receipt.xml_preview = buildPayrollXmlPreview(receipt);

  if (state.cloudReady) {
    const { data, error } = await state.supabase.from("miluga_payroll_receipts").insert(receipt).select().single();
    if (error) return alert(error.message);
    await loadCloudData();
    printPayrollReceipt(data);
  } else {
    const saved = { ...receipt, id: localId(), created_at: new Date().toISOString() };
    state.data.payrollReceipts.unshift(saved);
    saveLocalData();
    printPayrollReceipt(saved);
  }
  state.tab = "payroll";
  render();
}

async function nextFolio(kind) {
  if (state.cloudReady) {
    const { data, error } = await state.supabase.rpc("next_miluga_folio", { p_kind: kind });
    if (!error && data) return data;
  }
  const prefixes = { quote: "COT", order: "OS", invoice: "FAC", payroll: "NOM" };
  const key = kind === "quote" ? "quotes" : kind === "order" ? "orders" : kind === "payroll" ? "payrollReceipts" : "invoices";
  const number = state.data[key].length + 1;
  return `${prefixes[kind]}-${String(number).padStart(4, "0")}`;
}

async function upsertClientFromDocument(base) {
  if (!base.client_name) return;
  await state.supabase.from("miluga_clients").upsert({
    name: base.client_name,
    rfc: base.client_rfc || "",
    email: base.client_email || "",
    last_project_name: base.project_name || "",
  }, { onConflict: "owner_id,name" });
}

function upsertLocalClient(base) {
  if (!base.client_name) return;
  const found = state.data.clients.find((client) => client.name.toLowerCase() === base.client_name.toLowerCase());
  if (found) return;
  state.data.clients.unshift({
    id: localId(),
    name: base.client_name,
    rfc: base.client_rfc || "",
    email: base.client_email || "",
    created_at: new Date().toISOString(),
  });
}

async function loadRecoveredQuote() {
  const response = await fetch("./data/cotizacion-imss-clinica-28.json");
  const data = await response.json();
  const form = document.querySelector("#quote-form");
  form.client_name.value = data.client_name;
  form.client_rfc.value = data.client_tax_id;
  form.client_email.value = data.client_email || "";
  form.project_name.value = data.project_name;
  const body = form.querySelector("#quote-items tbody");
  body.innerHTML = data.items.map((item) => quoteItemRow(item)).join("");
  bindRowRemoveButtons(body);
}

function bindRowRemoveButtons(root) {
  root.querySelectorAll('[data-action="remove-row"]').forEach((button) => {
    button.addEventListener("click", () => button.closest("tr")?.remove());
  });
}

function bindClientAutofill() {
  bindClientLookup(app.querySelector("#quote-form"), "client_name", fillQuoteClient);
  bindClientLookup(app.querySelector("#order-form"), "client_name", fillOrderClient);
  bindClientLookup(app.querySelector("#invoice-form"), "receiver_name", fillInvoiceClient);
}

function bindPayrollAutofill() {
  const form = app.querySelector("#payroll-form");
  const input = form?.elements?.employee_name;
  if (!input) return;

  const applySelectedEmployee = () => {
    const employee = findPayrollEmployeeByName(input.value);
    if (employee) fillPayrollEmployee(form, employee);
  };

  input.addEventListener("input", applySelectedEmployee);
  input.addEventListener("change", applySelectedEmployee);
}

function bindClientLookup(form, fieldName, fillClient) {
  const input = form?.elements?.[fieldName];
  if (!input) return;

  const applySelectedClient = () => {
    const client = findClientByName(input.value);
    if (client) fillClient(form, client);
  };

  input.addEventListener("input", applySelectedClient);
  input.addEventListener("change", applySelectedClient);
}

function fillQuoteClient(form, client) {
  setFieldValue(form, "client_rfc", client.rfc);
  setFieldValue(form, "client_email", client.email);
  if (client.last_project_name) setFieldValue(form, "project_name", client.last_project_name);
}

function fillOrderClient(form, client) {
  setFieldValue(form, "client_rfc", client.rfc);
  setFieldValue(form, "client_email", client.email);
  setFieldValue(form, "client_phone", client.phone);
  setFieldValue(form, "service_location", client.address);
  setFieldValue(form, "receiver_name", client.contact_name);
  setFieldValue(form, "receiver_role", client.contact_role);
}

function fillInvoiceClient(form, client) {
  setFieldValue(form, "receiver_rfc", client.rfc);
  setFieldValue(form, "receiver_email", client.email);
  setFieldValue(form, "receiver_regime", client.regime);
  setFieldValue(form, "receiver_zip", client.fiscal_zip);
}

function fillPayrollEmployee(form, employee) {
  setFieldValue(form, "employee_id", employee.id);
  setFieldValue(form, "employee_rfc", employee.rfc);
  setFieldValue(form, "employee_curp", employee.curp);
  setFieldValue(form, "employee_nss", employee.nss);
  setFieldValue(form, "employee_regime", employee.employee_regime);
  setFieldValue(form, "payment_frequency", employee.payment_frequency);
  setFieldValue(form, "contract_type", employee.contract_type);
  setFieldValue(form, "department", employee.department);
  setFieldValue(form, "position", employee.position);
  setFieldValue(form, "daily_salary", employee.daily_salary);
  setFieldValue(form, "base_salary", employee.base_salary);
}

function setFieldValue(form, fieldName, value) {
  const field = form?.elements?.[fieldName];
  if (field && value) field.value = value;
}

function findClientByName(name) {
  const normalized = normalizeClientName(name);
  if (!normalized) return null;
  return state.data.clients.find((client) => normalizeClientName(client.name) === normalized) || null;
}

function findPayrollEmployeeByName(name) {
  const normalized = normalizeClientName(name);
  if (!normalized) return null;
  return state.data.payrollEmployees.find((employee) => normalizeClientName(employee.full_name) === normalized) || null;
}

function normalizeClientName(value) {
  return String(value || "").trim().toLocaleLowerCase("es-MX");
}

function printRecord(kind, id) {
  if (kind === "quote") {
    const quote = state.data.quotes.find((item) => item.id === id);
    const items = state.data.quoteItems.filter((item) => item.quote_id === id);
    printQuote(quote, items);
  }
  if (kind === "order") printOrder(state.data.orders.find((item) => item.id === id));
  if (kind === "invoice") printInvoice(state.data.invoices.find((item) => item.id === id));
  if (kind === "payroll") printPayrollReceipt(state.data.payrollReceipts.find((item) => item.id === id));
}

function printQuote(quote, items) {
  openPrintWindow(`Cotizacion ${quote.folio}`, `
    ${documentHeader("Cotizacion", quote.folio)}
    ${infoGrid([
      ["Cliente", quote.client_name],
      ["RFC", quote.client_rfc || "No especificado"],
      ["Proyecto", quote.project_name],
      ["Fecha", formatDate(quote.created_at)],
    ])}
    ${table(["Descripcion", "Cantidad", "Precio unitario", "Importe"], items.map((item) => [
      item.description, item.quantity, formatMoney(item.unit_price), formatMoney(item.total),
    ]))}
    ${totalsBlock(quote)}
    ${notesBlock()}
  `);
}

function printOrder(order) {
  openPrintWindow(`Orden ${order.folio}`, `
    ${documentHeader("Orden de servicio", order.folio)}
    ${infoGrid([
      ["Cliente", order.client_name],
      ["RFC", order.client_rfc || "No especificado"],
      ["Ubicacion", order.service_location || ""],
      ["Fecha", order.service_date || formatDate(order.created_at)],
      ["Tecnico", order.technician_name || ""],
      ["Recibe", order.receiver_name || ""],
    ])}
    <h2>Trabajos realizados</h2>
    <p>${escapeHtml(order.work_description || "")}</p>
    ${table(["Descripcion", "Cantidad", "Unidad", "Observacion"], (order.materials || []).map((item) => [
      item.description, item.quantity, item.unit, item.note,
    ]))}
    <h2>Observaciones</h2>
    <p>${escapeHtml(order.observations || "")}</p>
  `);
}

function printInvoice(invoice) {
  openPrintWindow(`Factura ${invoice.folio}`, `
    ${documentHeader("Borrador de factura", invoice.folio)}
    ${infoGrid([
      ["Emisor", COMPANY.name],
      ["RFC emisor", COMPANY.rfc],
      ["Receptor", invoice.receiver_name],
      ["RFC receptor", invoice.receiver_rfc],
      ["Uso CFDI", invoice.cfdi_use || ""],
      ["Metodo / forma", `${invoice.payment_method || ""} / ${invoice.payment_form || ""}`],
    ])}
    ${table(["Clave", "Descripcion", "Cantidad", "Precio", "Importe"], (invoice.items || []).map((item) => [
      item.sat_code, item.description, item.quantity, formatMoney(item.unit_price), formatMoney(item.total),
    ]))}
    ${totalsBlock(invoice)}
    <h2>XML preliminar</h2>
    <pre>${escapeHtml(invoice.xml_preview || "")}</pre>
  `);
}

function printPayrollReceipt(receipt) {
  const perceptions = receipt?.perceptions || [];
  const deductions = receipt?.deductions || [];
  openPrintWindow(`Nomina ${receipt?.folio || ""}`, `
    ${documentHeader("Recibo de nomina", receipt?.folio)}
    ${infoGrid([
      ["Empleado", receipt?.employee_name],
      ["RFC", receipt?.employee_rfc],
      ["CURP", receipt?.employee_curp],
      ["NSS", receipt?.employee_nss],
      ["Periodo", `${receipt?.period_start || ""} al ${receipt?.period_end || ""}`],
      ["Fecha pago", receipt?.payment_date],
      ["Dias pagados", receipt?.paid_days],
      ["Estado", receipt?.status === "timbrado" ? "Timbrado" : "Pre-timbrado"],
    ])}
    <h2>Percepciones</h2>
    ${table(["Tipo", "Concepto", "Gravado", "Exento", "Importe"], perceptions.map((item) => [
      item.type, item.description, formatMoney(item.taxable_amount), formatMoney(item.exempt_amount), formatMoney(Number(item.taxable_amount || 0) + Number(item.exempt_amount || 0)),
    ]))}
    <h2>Deducciones</h2>
    ${table(["Tipo", "Concepto", "Importe"], deductions.map((item) => [
      item.type, item.description, formatMoney(item.amount),
    ]))}
    ${payrollTotalsBlock(receipt)}
    <h2>XML preliminar</h2>
    <pre>${escapeHtml(receipt?.xml_preview || "")}</pre>
  `);
}

function documentHeader(title, folio) {
  return `
    <header class="doc-head">
      <img src="./assets/logo-luga.jpeg" alt="MILUGA">
      <div><h1>${escapeHtml(title)}</h1><p>${COMPANY.name}</p><p>RFC: ${COMPANY.rfc}</p></div>
      <strong>${escapeHtml(folio || "")}</strong>
    </header>
  `;
}

function infoGrid(rows) {
  return `<div class="print-grid">${rows.map(([label, value]) => `<div><b>${escapeHtml(label)}</b><span>${escapeHtml(value || "")}</span></div>`).join("")}</div>`;
}

function table(headers, rows) {
  return `
    <table class="print-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

function totalsBlock(record) {
  return `
    <div class="totals">
      <div><span>Subtotal</span><strong>${formatMoney(record.subtotal || 0)}</strong></div>
      <div><span>IVA</span><strong>${formatMoney(record.tax || 0)}</strong></div>
      <div class="grand"><span>Total</span><strong>${formatMoney(record.total || 0)}</strong></div>
    </div>
  `;
}

function payrollTotalsBlock(record) {
  return `
    <div class="totals">
      <div><span>Total percepciones</span><strong>${formatMoney(record?.total_perceptions || 0)}</strong></div>
      <div><span>Total deducciones</span><strong>${formatMoney(record?.total_deductions || 0)}</strong></div>
      <div class="grand"><span>Neto a pagar</span><strong>${formatMoney(record?.net_total || 0)}</strong></div>
    </div>
  `;
}

function notesBlock() {
  return `
    <h2>Observaciones</h2>
    <ul>
      <li>La presente cotizacion tiene una vigencia de 15 dias naturales a partir de su fecha de emision.</li>
      <li>Los trabajos se realizaran conforme al alcance acordado y en horarios previamente coordinados.</li>
      <li>Los precios incluyen mano de obra y materiales basicos, salvo que se indique lo contrario.</li>
    </ul>
  `;
}

function openPrintWindow(title, body) {
  const win = window.open("", "_blank");
  const baseHref = document.querySelector("base")?.href || location.href.replace(/[^/]*$/, "");
  win.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <base href="${baseHref}">
        <link rel="stylesheet" href="./styles.css">
      </head>
      <body class="print-body">${body}<script>window.onload = () => window.print();<\/script></body>
    </html>
  `);
  win.document.close();
}

function buildXmlPreview(base, items, subtotal, tax) {
  const concepts = items.map((item) => `
    <cfdi:Concepto ClaveProdServ="${escapeXml(item.sat_code)}" Cantidad="${item.quantity}" ClaveUnidad="E48" Descripcion="${escapeXml(item.description)}" ValorUnitario="${item.unit_price.toFixed(2)}" Importe="${(item.quantity * item.unit_price).toFixed(2)}" ObjetoImp="02" />`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Version="4.0" Serie="A" Folio="BORRADOR" Moneda="${COMPANY.currency}" SubTotal="${subtotal.toFixed(2)}" Total="${(subtotal + tax).toFixed(2)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${escapeXml(base.payment_method || "PUE")}" FormaPago="${escapeXml(base.payment_form || "03")}">
  <cfdi:Emisor Rfc="${COMPANY.rfc}" Nombre="${escapeXml(COMPANY.name)}" RegimenFiscal="601" />
  <cfdi:Receptor Rfc="${escapeXml(base.receiver_rfc)}" Nombre="${escapeXml(base.receiver_name)}" DomicilioFiscalReceptor="${escapeXml(base.receiver_zip || "")}" RegimenFiscalReceptor="${escapeXml(base.receiver_regime || "")}" UsoCFDI="${escapeXml(base.cfdi_use || "")}" />
  <cfdi:Conceptos>${concepts}
  </cfdi:Conceptos>
</cfdi:Comprobante>`;
}

function buildPayrollXmlPreview(receipt) {
  const perceptions = receipt.perceptions || [];
  const deductions = receipt.deductions || [];
  const taxable = sum(perceptions.map((item) => item.taxable_amount));
  const exempt = sum(perceptions.map((item) => item.exempt_amount));
  const totalDeductions = Number(receipt.total_deductions || 0);
  const taxWithheld = sum(deductions.filter((item) => item.type === "002").map((item) => item.amount));
  const otherDeductions = Math.max(totalDeductions - taxWithheld, 0);
  const subtotal = Number(receipt.total_perceptions || 0);
  const total = Number(receipt.net_total || 0);
  const folio = String(receipt.folio || "BORRADOR").replace(/^NOM-?/, "");
  const now = new Date().toISOString().slice(0, 19);
  const perceptionNodes = perceptions.map((item, index) => `
        <nomina12:Percepcion TipoPercepcion="${escapeXml(item.type)}" Clave="${String(index + 1).padStart(3, "0")}" Concepto="${escapeXml(item.description)}" ImporteGravado="${moneyXml(item.taxable_amount)}" ImporteExento="${moneyXml(item.exempt_amount)}" />`).join("");
  const deductionNodes = deductions.map((item, index) => `
        <nomina12:Deduccion TipoDeduccion="${escapeXml(item.type)}" Clave="${String(index + 1).padStart(3, "0")}" Concepto="${escapeXml(item.description)}" Importe="${moneyXml(item.amount)}" />`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina12="http://www.sat.gob.mx/nomina12" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd" Version="4.0" Serie="NOM" Folio="${escapeXml(folio)}" Fecha="${now}" Sello="PENDIENTE_DE_CSD" NoCertificado="PENDIENTE_DE_CSD" Certificado="PENDIENTE_DE_CSD" SubTotal="${moneyXml(subtotal)}" Descuento="${moneyXml(totalDeductions)}" Moneda="MXN" Total="${moneyXml(total)}" TipoDeComprobante="N" Exportacion="01" MetodoPago="PUE" LugarExpedicion="PENDIENTE">
  <cfdi:Emisor Rfc="${COMPANY.rfc}" Nombre="${escapeXml(COMPANY.name)}" RegimenFiscal="601" />
  <cfdi:Receptor Rfc="${escapeXml(receipt.employee_rfc)}" Nombre="${escapeXml(receipt.employee_name)}" DomicilioFiscalReceptor="${escapeXml(receipt.employee_fiscal_zip || "PENDIENTE")}" RegimenFiscalReceptor="605" UsoCFDI="CN01" />
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111505" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago de nomina" ValorUnitario="${moneyXml(subtotal)}" Importe="${moneyXml(subtotal)}" Descuento="${moneyXml(totalDeductions)}" ObjetoImp="01" />
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <nomina12:Nomina Version="1.2" TipoNomina="${escapeXml(receipt.payroll_type || "O")}" FechaPago="${escapeXml(receipt.payment_date)}" FechaInicialPago="${escapeXml(receipt.period_start)}" FechaFinalPago="${escapeXml(receipt.period_end)}" NumDiasPagados="${Number(receipt.paid_days || 0).toFixed(3)}" TotalPercepciones="${moneyXml(subtotal)}" TotalDeducciones="${moneyXml(totalDeductions)}">
      <nomina12:Emisor />
      <nomina12:Receptor Curp="${escapeXml(receipt.employee_curp)}" NumSeguridadSocial="${escapeXml(receipt.employee_nss || "")}" FechaInicioRelLaboral="${escapeXml(receipt.start_date || "")}" TipoContrato="${escapeXml(receipt.contract_type || "")}" TipoJornada="${escapeXml(receipt.workday_type || "")}" TipoRegimen="${escapeXml(receipt.employee_regime || "02")}" NumEmpleado="${escapeXml(receipt.employee_number || "PENDIENTE")}" Departamento="${escapeXml(receipt.department || "")}" Puesto="${escapeXml(receipt.position || "")}" RiesgoPuesto="${escapeXml(receipt.risk_class || "")}" PeriodicidadPago="${escapeXml(receipt.payment_frequency || "")}" SalarioBaseCotApor="${moneyXml(receipt.base_salary)}" SalarioDiarioIntegrado="${moneyXml(receipt.daily_salary)}" ClaveEntFed="JAL" />
      <nomina12:Percepciones TotalSueldos="${moneyXml(subtotal)}" TotalGravado="${moneyXml(taxable)}" TotalExento="${moneyXml(exempt)}">${perceptionNodes}
      </nomina12:Percepciones>${deductions.length ? `
      <nomina12:Deducciones TotalOtrasDeducciones="${moneyXml(otherDeductions)}" TotalImpuestosRetenidos="${moneyXml(taxWithheld)}">${deductionNodes}
      </nomina12:Deducciones>` : ""}
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return new Date().toLocaleDateString("es-MX");
  return new Date(value).toLocaleDateString("es-MX");
}

function moneyXml(value) {
  return Number(value || 0).toFixed(2);
}

function roleLabel(role) {
  const labels = {
    owner: "Principal",
    admin: "Administrador",
    staff: "Usuario",
  };
  return labels[role] || "Usuario";
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function localId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(value) {
  return escapeHtml(value);
}
