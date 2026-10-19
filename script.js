// Importa la configuración y las funciones del SDK de Firebase.
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Inicializa Firebase y apunta a la colección donde se guardan los registros.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const recordsCol = collection(db, "registros");
const SETTINGS_DOC_ID = 'app_settings';
const settingsRef = doc(recordsCol, SETTINGS_DOC_ID);
const AUTHORIZED_UID = 'iXIzrwtekxN8QMpZUge3grgAsp53';
let unsubscribeRecords = null;

// Estado local de la interfaz y opciones iniciales para filtros y formularios.
let records = [];
let editingId = null;
let estadoChip = '';
let optionsDraft = null;
const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}`;
const DEFAULT_SERVICIOS = ["FACT PRIORITARIA","SALA DE PARTOS","CONSULTORIO 1","CONSULTORIO 2","CONSULTORIO 3",
  "FACT HOSPITALIZACION","HOSPITALIZACION","PROGRAMACION QX","CIRUGIA","LABORATORIO 107","LABORATORIO 135W",
  "FARMACIA 107","FARMACIA 135W","UCI NEONATAL","COORDINACION ENFERMERIA","FACTURACION OFICINA","CITAS OFICINA"];
const DEFAULT_PERSONAS = ["MARIA_JOO","JUAN GUILLERMO","JUAN SEBASTIAN"];
let settings = {
  servicios: [...DEFAULT_SERVICIOS],
  responsables: [...DEFAULT_PERSONAS],
};

// Devuelve los colores asociados al estado para las tarjetas de resultados.
function statusMeta(estado){
  switch((estado||'').toUpperCase()){
    case 'RECARGADO':
    case 'CAMBIADO':
      return {solid:'var(--ok)', bg:'var(--ok-bg)', color:'var(--ok-strong)'};
    case 'PENDIENTE':
      return {solid:'var(--warn)', bg:'var(--warn-bg)', color:'var(--warn-strong)'};
    case 'SIN STOCK':
      return {solid:'var(--danger)', bg:'var(--danger-bg)', color:'var(--danger-strong)'};
    default:
      return {solid:'var(--neutral)', bg:'var(--neutral-bg)', color:'var(--ink-soft)'};
  }
}

// Convierte una fecha ISO (AAAA-MM-DD) al formato habitual DD/MM/AAAA.
function fmtDate(d){
  if(!d) return '—';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// Muestra un aviso temporal en la parte inferior de la pantalla.
function showStatus(msg, color){
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.style.background = color || 'var(--ink)';
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1800);
}

// Sincroniza Firestore solo después de validar la cuenta autenticada.
function startRecordsListener(){
  if(unsubscribeRecords) return;
  unsubscribeRecords = onSnapshot(recordsCol, (snapshot) => {
    const settingsDocument = snapshot.docs.find(d => d.id === SETTINGS_DOC_ID);
    if(settingsDocument){
      const savedSettings = settingsDocument.data();
      settings = {
        servicios: normalizeOptions(savedSettings.servicios, DEFAULT_SERVICIOS),
        responsables: normalizeOptions(savedSettings.responsables, DEFAULT_PERSONAS),
      };
    }
    records = snapshot.docs
      .filter(d => d.id !== SETTINGS_DOC_ID)
      .map(d => ({ id: d.id, ...d.data() }));
    populateFilterOptions();
    render();
    renderMonthlyReport();
    document.getElementById('subtitle').textContent =
      `${records.length} registro${records.length===1?'':'s'} · sincronizado en tiempo real`;
  }, (error) => {
    document.getElementById('subtitle').textContent = 'No se pudo conectar a la base de datos';
    console.error(error);
  });
}

function stopRecordsListener(){
  if(unsubscribeRecords){
    unsubscribeRecords();
    unsubscribeRecords = null;
  }
  records = [];
}

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('btnLogin');
  button.disabled = true;
  loginError.textContent = '';
  try{
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if(credential.user.uid !== AUTHORIZED_UID){
      await signOut(auth);
      throw new Error('not-authorized');
    }
  }catch(error){
    console.error(error);
    loginError.textContent = error.message === 'not-authorized'
      ? 'Esta cuenta no tiene permiso para entrar.'
      : 'No se pudo iniciar sesión. Revisa el correo y la contraseña.';
  }finally{
    button.disabled = false;
  }
});

document.getElementById('btnLogout').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if(!user){
    document.body.classList.remove('authenticated');
    stopRecordsListener();
    return;
  }
  if(user.uid !== AUTHORIZED_UID){
    await signOut(auth);
    loginError.textContent = 'Esta cuenta no tiene permiso para entrar.';
    return;
  }
  document.body.classList.add('authenticated');
  startRecordsListener();
});

// Completa filtros y listas del formulario con valores iniciales y existentes.
function populateFilterOptions(){
  const historicalServices = records.map(r => r.servicio).filter(Boolean);
  const historicalPeople = records.map(r => r.cambiadoPor).filter(Boolean);
  const filterServices = normalizeOptions([...settings.servicios, ...historicalServices], []);
  const filterPeople = normalizeOptions([...settings.responsables, ...historicalPeople], []);
  const currentRecord = records.find(r => r.id === editingId);
  const formServices = normalizeOptions([
    ...settings.servicios,
    currentRecord?.servicio,
  ].filter(Boolean), []);
  const formPeople = normalizeOptions([
    ...settings.responsables,
    currentRecord?.cambiadoPor,
  ].filter(Boolean), []);

  replaceSelectOptions(document.getElementById('fServicio'), 'Todos los servicios', filterServices);
  replaceSelectOptions(document.getElementById('fPersona'), 'Responsables', filterPeople);
  replaceSelectOptions(document.getElementById('fld_servicio'), 'Selecciona un servicio', formServices);
  replaceSelectOptions(document.getElementById('fld_cambiadoPor'), 'Selecciona un responsable', formPeople);
}

function normalizeOptions(values, fallback){
  const source = Array.isArray(values) ? values : fallback;
  return [...new Set(source
    .map(value => String(value).trim().toUpperCase())
    .filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

function replaceSelectOptions(select, placeholder, values){
  const previousValue = select.value;
  select.replaceChildren(new Option(placeholder, ''));
  values.forEach(value => select.add(new Option(value, value)));
  select.value = values.includes(previousValue) ? previousValue : '';
}

// Lee los criterios activos para usarlos al filtrar la colección local.
function currentFilters(){
  return {
    search: document.getElementById('fSearch').value.trim().toLowerCase(),
    fecha: document.getElementById('fFecha').value,
    servicio: document.getElementById('fServicio').value,
    persona: document.getElementById('fPersona').value,
    estado: estadoChip,
  };
}

// Filtra, ordena y dibuja tarjetas; también actualiza los contadores generales.
function render(){
  const {search, fecha, servicio, persona, estado} = currentFilters();
  let filtered = records.filter(r=>{
    if(servicio && r.servicio !== servicio) return false;
    if(estado && (r.estadoFinal||'').toUpperCase() !== estado) return false;
    if(persona && r.cambiadoPor !== persona) return false;
    if(fecha && r.fechaCambio !== fecha && r.fechaRecarga !== fecha) return false;
    if(search){
      const hay = `${r.idToner} ${r.reemplazadoPor} ${r.servicio} ${r.observacion} ${r.novedad}`.toLowerCase();
      if(!hay.includes(search)) return false;
    }
    return true;
  });
  filtered.sort((a,b)=>{
    const creationDifference = Number(b.createdAt || 0) - Number(a.createdAt || 0);
    return creationDifference || (b.fechaCambio||'').localeCompare(a.fechaCambio||'');
  });

  document.getElementById('statTotal').textContent = records.length;
  document.getElementById('statOk').textContent = records.filter(r=>['RECARGADO','CAMBIADO'].includes((r.estadoFinal||'').toUpperCase())).length;
  document.getElementById('statPend').textContent = records.filter(r=>(r.estadoFinal||'').toUpperCase()==='PENDIENTE').length;
  document.getElementById('statSin').textContent = records.filter(r=>(r.estadoFinal||'').toUpperCase()==='SIN STOCK').length;

  const grid = document.getElementById('grid');
  if(filtered.length === 0){
    grid.innerHTML = `<div class="empty"><b>Sin registros</b>Agrega tu primer cambio o recarga de tóner con el botón de arriba.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(r=>{
    const meta = statusMeta(r.estadoFinal);
    return `
      <details class="card" style="border-left-color:${meta.solid}">
        <summary class="card-summary">
          <span class="badge" style="background:${meta.bg}; color:${meta.color}">${r.estadoFinal || 'SIN ESTADO'}</span>
          <span class="servicio">${r.servicio || 'Sin servicio'}</span>
          <span class="toner-id">ID tóner: #${r.idToner || '—'}</span>
        </summary>
        <div class="card-details">
          <div class="meta"><span>ID de reemplazo</span><b>${r.reemplazadoPor || '—'}</b></div>
          <div class="meta"><span>Fecha de cambio</span><b>${fmtDate(r.fechaCambio)}</b></div>
          <div class="meta"><span>Fecha de recarga</span><b>${fmtDate(r.fechaRecarga)}</b></div>
          <div class="meta"><span>Responsable</span><b>${r.cambiadoPor || '—'}</b></div>
          <div class="meta"><span>Cilindros</span><b>${r.cilindros || '—'}</b></div>
          <div class="meta"><span>Impresiones</span><b>${r.impresiones || '—'}</b></div>
          <div class="meta"><span>Novedad</span><b>${r.novedad || '—'}</b></div>
          <button class="btn btn-ghost card-edit" type="button" data-id="${r.id}">Editar</button>
        </div>
      </details>`;
  }).join('');

  grid.querySelectorAll('.card-edit').forEach(button=>{
    button.addEventListener('click', ()=> openModal(button.dataset.id));
  });
}

// Agrupa los movimientos del mes por servicio y calcula los importes del reporte.
function renderMonthlyReport(){
  const month = document.getElementById('reportMonth').value || currentMonth;
  const tonerValue = Number(document.getElementById('reportTonerValue').value) || 0;
  const cylinderValue = Number(document.getElementById('reportCylinderValue').value) || 0;
  const monthly = records.filter(r => (r.fechaRecarga || r.fechaCambio || '').startsWith(month));
  const grouped = new Map();

  monthly.forEach(record => {
    const service = record.servicio || 'Sin servicio';
    const row = grouped.get(service) || { recargas: 0, cambios: 0, cilindros: 0, total: 0 };
    const state = (record.estadoFinal || '').toUpperCase();
    if(state === 'RECARGADO') row.recargas += 1;
    if(state === 'CAMBIADO') row.cambios += 1;
    row.cilindros += Number(record.cilindros) || 0;
    row.total += 1;
    grouped.set(service, row);
  });

  const rows = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  document.getElementById('reportBody').innerHTML = rows.length
    ? rows.map(([service, row]) => {
      const tonerSubtotal = (row.recargas + row.cambios) * tonerValue;
      const cylinderSubtotal = row.cilindros * cylinderValue;
      return `<tr><td>${service}</td><td>${row.recargas}</td><td>${row.cambios}</td><td>${row.cilindros}</td><td>${formatMoney(tonerSubtotal)}</td><td>${formatMoney(cylinderSubtotal)}</td><td>${formatMoney(tonerSubtotal + cylinderSubtotal)}</td></tr>`;
    }).join('')
    : '<tr><td colspan="7" class="report-empty">No hay movimientos en este mes.</td></tr>';

  const totals = rows.reduce((sum, [, row]) => ({
    recargas: sum.recargas + row.recargas,
    cambios: sum.cambios + row.cambios,
    cilindros: sum.cilindros + row.cilindros,
    total: sum.total + row.total,
  }), { recargas: 0, cambios: 0, cilindros: 0, total: 0 });
  const totalTonerValue = (totals.recargas + totals.cambios) * tonerValue;
  const totalCylinderValue = totals.cilindros * cylinderValue;
  document.getElementById('reportFoot').innerHTML = `<tr><th>Total</th><th>${totals.recargas}</th><th>${totals.cambios}</th><th>${totals.cilindros}</th><th>${formatMoney(totalTonerValue)}</th><th>${formatMoney(totalCylinderValue)}</th><th>${formatMoney(totalTonerValue + totalCylinderValue)}</th></tr>`;
}

// Formatea importes usando la convención local de Colombia.
function formatMoney(value){
  return `$ ${value.toLocaleString('es-CO')}`;
}

// Abre el formulario vacío o carga en él los datos del registro seleccionado.
function openModal(id){
  editingId = id || null;
  const r = id ? records.find(x=>x.id===id) : null;
  populateFilterOptions();
  document.getElementById('modalTitle').textContent = r ? 'Editar registro' : 'Nuevo registro';
  document.getElementById('btnDelete').style.display = r ? 'inline-flex' : 'none';

  document.getElementById('fld_estadoFinal').value = r?.estadoFinal || 'RECARGADO';
  document.getElementById('fld_idToner').value = r?.idToner || '';
  document.getElementById('fld_servicio').value = r?.servicio || '';
  document.getElementById('fld_fechaCambio').value = r?.fechaCambio || '';
  document.getElementById('fld_fechaRecarga').value = r?.fechaRecarga || '';
  document.getElementById('fld_cilindros').value = r?.cilindros ?? '';
  document.getElementById('fld_impresiones').value = r?.impresiones ?? '';
  document.getElementById('fld_cambiadoPor').value = r?.cambiadoPor || '';
  document.getElementById('fld_reemplazadoPor').value = r?.reemplazadoPor || '';
  document.getElementById('fld_novedad').value = r?.novedad || '';

  document.getElementById('overlay').classList.add('open');
}

// Cierra el formulario y limpia el identificador de edición.
function closeModal(){
  document.getElementById('overlay').classList.remove('open');
  editingId = null;
}

// Valida los campos obligatorios y crea o actualiza el registro en Firestore.
async function saveForm(){
  const data = {
    estadoFinal: document.getElementById('fld_estadoFinal').value,
    idToner: document.getElementById('fld_idToner').value.trim(),
    servicio: document.getElementById('fld_servicio').value.trim().toUpperCase(),
    fechaCambio: document.getElementById('fld_fechaCambio').value,
    fechaRecarga: document.getElementById('fld_fechaRecarga').value,
    cilindros: document.getElementById('fld_cilindros').value,
    impresiones: document.getElementById('fld_impresiones').value,
    cambiadoPor: document.getElementById('fld_cambiadoPor').value.trim().toUpperCase(),
    reemplazadoPor: document.getElementById('fld_reemplazadoPor').value.trim(),
    novedad: document.getElementById('fld_novedad').value.trim(),
  };
  if(!data.idToner || !data.servicio){
    const missingFields = !data.idToner && !data.servicio
      ? 'Ingresa el ID del tóner y selecciona al menos un servicio.'
      : !data.idToner
        ? 'Ingresa el ID del tóner.'
        : 'Selecciona al menos un servicio.';
    showStatus(missingFields, 'var(--danger)');
    return;
  }
  try{
    if(editingId){
      await updateDoc(doc(db, "registros", editingId), data);
    }else{
      await addDoc(recordsCol, {...data, createdAt: Date.now()});
    }
    closeModal();
    showStatus('Registro guardado.', 'var(--ok)');
  }catch(e){
    console.error(e);
    showStatus('No se pudo guardar. Revisa tu conexión.', 'var(--danger)');
  }
}

// Elimina de Firestore el registro que está abierto en el formulario.
async function deleteRecord(){
  if(!editingId) return;
  try{
    await deleteDoc(doc(db, "registros", editingId));
    closeModal();
    showStatus('Registro eliminado.', 'var(--danger)');
  }catch(e){
    console.error(e);
    showStatus('No se pudo eliminar. Revisa tu conexión.', 'var(--danger)');
  }
}

function openOptions(){
  optionsDraft = {
    servicios: [...settings.servicios],
    responsables: [...settings.responsables],
  };
  document.getElementById('optionsType').value = 'servicios';
  document.getElementById('newOption').value = '';
  renderManagedOptions();
  document.getElementById('optionsOverlay').classList.add('open');
}

function closeOptions(){
  document.getElementById('optionsOverlay').classList.remove('open');
  optionsDraft = null;
}

function renderManagedOptions(){
  const list = document.getElementById('managedOptions');
  const optionType = document.getElementById('optionsType').value;
  const options = optionsDraft?.[optionType] || [];
  list.replaceChildren();

  if(options.length === 0){
    const empty = document.createElement('li');
    empty.className = 'option-empty';
    empty.textContent = 'No hay opciones en esta lista.';
    list.append(empty);
    return;
  }

  options.forEach((option, index) => {
    const row = document.createElement('li');
    row.className = 'option-row';
    const label = document.createElement('span');
    label.textContent = option;
    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-ghost option-remove';
    removeButton.type = 'button';
    removeButton.textContent = 'Quitar';
    removeButton.setAttribute('aria-label', `Quitar ${option}`);
    removeButton.addEventListener('click', () => {
      optionsDraft[optionType].splice(index, 1);
      renderManagedOptions();
    });
    row.append(label, removeButton);
    list.append(row);
  });
}

function addManagedOption(){
  const optionType = document.getElementById('optionsType').value;
  const input = document.getElementById('newOption');
  const value = input.value.trim().toUpperCase();
  if(!value) return;
  if(optionsDraft[optionType].includes(value)){
    showStatus('Esa opción ya existe.', 'var(--danger)');
    return;
  }
  optionsDraft[optionType] = normalizeOptions([...optionsDraft[optionType], value], []);
  input.value = '';
  renderManagedOptions();
  input.focus();
}

async function saveManagedOptions(){
  const button = document.getElementById('btnSaveOptions');
  button.disabled = true;
  try{
    const updatedSettings = {
      servicios: normalizeOptions(optionsDraft.servicios, []),
      responsables: normalizeOptions(optionsDraft.responsables, []),
    };
    await setDoc(settingsRef, updatedSettings);
    settings = updatedSettings;
    populateFilterOptions();
    closeOptions();
    showStatus('Opciones guardadas.', 'var(--ok)');
  }catch(error){
    console.error(error);
    showStatus('No se pudieron guardar las opciones.', 'var(--danger)');
  }finally{
    button.disabled = false;
  }
}

// Conecta botones, filtros, reporte y modal con sus acciones correspondientes.
document.querySelectorAll('#estadoChips .chip').forEach(chip=>{
  if(chip.textContent.trim().toLocaleLowerCase() === 'no tenemos') chip.remove();
});
document.getElementById('btnNew').addEventListener('click', ()=>openModal(null));
document.getElementById('btnOptions').addEventListener('click', openOptions);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnSave').addEventListener('click', saveForm);
document.getElementById('btnDelete').addEventListener('click', deleteRecord);
document.getElementById('reportMonth').value = currentMonth;
document.getElementById('reportMonth').addEventListener('change', renderMonthlyReport);
['reportTonerValue','reportCylinderValue'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderMonthlyReport);
});
document.getElementById('btnPrintReport').addEventListener('click', () => window.print());
document.getElementById('overlay').addEventListener('click', (e)=>{ if(e.target.id==='overlay') closeModal(); });
document.getElementById('optionsType').addEventListener('change', renderManagedOptions);
document.getElementById('btnAddOption').addEventListener('click', addManagedOption);
document.getElementById('newOption').addEventListener('keydown', (event)=>{
  if(event.key === 'Enter'){
    event.preventDefault();
    addManagedOption();
  }
});
document.getElementById('btnCancelOptions').addEventListener('click', closeOptions);
document.getElementById('btnSaveOptions').addEventListener('click', saveManagedOptions);
document.getElementById('optionsOverlay').addEventListener('click', (event)=>{
  if(event.target.id === 'optionsOverlay') closeOptions();
});
['fSearch','fFecha','fServicio','fPersona'].forEach(id=>{
  document.getElementById(id).addEventListener('input', render);
  document.getElementById(id).addEventListener('change', render);
});
document.getElementById('estadoChips').addEventListener('click', (e)=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  estadoChip = chip.dataset.v;
  render();
});
