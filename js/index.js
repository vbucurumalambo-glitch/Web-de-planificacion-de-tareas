/* ==========================================================
   Planificador de Tareas · app.js
   - Validación del formulario (validFormFieldInput)
   - Alertas de error, tarjetas y lista de tareas
   - Marcar / desmarcar una tarea como completada
   - Frases de ánimo y música ambiental
   ========================================================== */

'use strict';

const STORAGE_KEY = 'planificadorTareas';

const ESTADOS = {
  pendiente: 'Pendiente',
  progreso: 'En progreso',
  completada: 'Completada'
};

/* ---------- Referencias al DOM ---------- */
const taskForm = document.querySelector('#taskForm');
const newTaskNameInput = document.querySelector('#newTaskNameInput');
const newTaskDescriptionInput = document.querySelector('#newTaskDescriptionInput');
const newTaskDateInput = document.querySelector('#newTaskDateInput');
const newTaskStatusSelect = document.querySelector('#newTaskStatusSelect');

const formAlert = document.querySelector('#formAlert');
const formAlertList = document.querySelector('#formAlertList');

const taskCards = document.querySelector('#taskCards');
const taskList = document.querySelector('#taskList');
const listaVacia = document.querySelector('#listaVacia');
const filtroTareas = document.querySelector('#filtroTareas');
const vistaTarjetasBtn = document.querySelector('#vistaTarjetasBtn');
const vistaListaBtn = document.querySelector('#vistaListaBtn');

/* ---------- Estado de la aplicación ---------- */
const taskManager = new TaskManager();
console.log(taskManager.tasks);

let tareas = cargarTareas();
let filtroActual = 'todas';
let vistaActual = 'tarjetas';

/* ==========================================================
   1. VALIDACIÓN
   ========================================================== */

/**
 * Revisa los datos del formulario antes de procesarlos.
 * @param {{name:string, description:string, date:string, status:string}} data
 * @returns {{valido:boolean, errores:Array<{campo:string, mensaje:string}>}}
 */
function validFormFieldInput(data) {
  const errores = [];

  if (!data.name || data.name.trim() === '') {
    errores.push({ campo: 'name', mensaje: 'El nombre de la tarea no puede estar vacío.' });
  }

  if (!data.description || data.description.trim() === '') {
    errores.push({ campo: 'description', mensaje: 'La descripción no puede estar vacía.' });
  }

  // El input type="date" devuelve "" si no hay fecha completa
  if (!data.date || isNaN(new Date(data.date + 'T00:00:00').getTime())) {
    errores.push({ campo: 'date', mensaje: 'Debes ingresar una fecha de entrega.' });
  }

  if (!data.status) {
    errores.push({ campo: 'status', mensaje: 'Debes seleccionar un estado.' });
  }

  return { valido: errores.length === 0, errores };
}

/** Lee los valores actuales del formulario. */
function obtenerDatosFormulario() {
  const name = newTaskNameInput.value;
  const description = newTaskDescriptionInput.value;
  const date = newTaskDateInput.value;
  const status = newTaskStatusSelect.value;

  console.log('name: ' + name);
  console.log('description: ' + description);
  console.log('date: ' + date);
  console.log('status: ' + status);

  return { name, description, date, status };
}

const camposPorNombre = {
  name: newTaskNameInput,
  description: newTaskDescriptionInput,
  date: newTaskDateInput,
  status: newTaskStatusSelect
};

function limpiarMarcas() {
  Object.values(camposPorNombre).forEach(campo => campo.classList.remove('is-invalid'));
}

function mostrarErrores(errores) {
  limpiarMarcas();
  formAlertList.innerHTML = '';

  errores.forEach(error => {
    camposPorNombre[error.campo].classList.add('is-invalid');
    const item = document.createElement('li');
    item.textContent = error.mensaje;
    formAlertList.appendChild(item);
  });

  formAlert.classList.remove('d-none');
  formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function ocultarErrores() {
  limpiarMarcas();
  formAlert.classList.add('d-none');
  formAlertList.innerHTML = '';
}

taskForm.addEventListener('submit', evento => {
  evento.preventDefault();

  const data = obtenerDatosFormulario();
  const resultado = validFormFieldInput(data);

  if (!resultado.valido) {
    mostrarErrores(resultado.errores);
    sonidoError();
    return;
  }

  ocultarErrores();
  agregarTarea(data);
  taskForm.reset();
  sonidoExito();
  const boton = taskForm.querySelector('button[type="submit"]').getBoundingClientRect();
  confeti(boton.left + boton.width / 2, boton.top + boton.height / 2);
  mostrarToast('¡Tarea guardada! Una aventura más en tu lista 🎉');
});

// Quita la marca roja apenas el usuario corrige el campo
Object.values(camposPorNombre).forEach(campo => {
  const evento = campo.tagName === 'SELECT' ? 'change' : 'input';
  campo.addEventListener(evento, () => campo.classList.remove('is-invalid'));
});

/* ==========================================================
   2. DATOS (localStorage)
   ========================================================== */

function cargarTareas() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) return JSON.parse(guardado);
  } catch (error) {
    console.warn('No se pudo leer el almacenamiento local:', error);
  }

  // Primera visita: algunas tareas de ejemplo
  const hoy = new Date();
  const enDias = n => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  return [
    { id: 1, name: 'Diseñar el wireframe en Figma', description: 'Dibujar las pantallas principales del planificador.', date: enDias(2), status: 'completada' },
    { id: 2, name: 'Maquetar con Bootstrap', description: 'Convertir el wireframe en HTML responsive.', date: enDias(4), status: 'progreso' },
    { id: 3, name: 'Publicar en GitHub Pages', description: 'Subir el repositorio y copiar el enlace al README.', date: enDias(6), status: 'pendiente' }
  ];
}

function guardarTareas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
  } catch (error) {
    console.warn('No se pudo guardar en el almacenamiento local:', error);
  }
}

function agregarTarea(data) {
  tareas.unshift({
    id: Date.now(),
    name: data.name.trim(),
    description: data.description.trim(),
    date: data.date,
    status: data.status
  });
  guardarTareas();
  renderizar(true);
}

function eliminarTarea(id) {
  tareas = tareas.filter(t => t.id !== id);
  guardarTareas();
  renderizar();
}

/** Interruptor: alterna una tarea entre "completada" y "pendiente". */
function alternarCompletada(id) {
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return;
  tarea.status = tarea.status === 'completada' ? 'pendiente' : 'completada';
  guardarTareas();
  renderizar();
}

/* ==========================================================
   3. RENDERIZADO (tarjetas y lista)
   ========================================================== */

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function estaAtrasada(tarea) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return tarea.status !== 'completada' && new Date(tarea.date + 'T00:00:00') < hoy;
}

function crearBadges(tarea) {
  const badges = document.createElement('span');
  const estado = document.createElement('span');
  estado.className = 'badge badge-estado badge-' + tarea.status;
  estado.textContent = ESTADOS[tarea.status];
  badges.appendChild(estado);

  if (estaAtrasada(tarea)) {
    const atraso = document.createElement('span');
    atraso.className = 'badge badge-estado badge-atrasada ms-1';
    atraso.textContent = 'Atrasada';
    badges.appendChild(atraso);
  }
  return badges;
}

function crearBoton(texto, clase, accion) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-sm ' + clase;
  boton.textContent = texto;
  boton.addEventListener('click', accion);
  return boton;
}

function crearAcciones(tarea) {
  const acciones = document.createElement('div');
  acciones.className = 'tarea-acciones';
  const completada = tarea.status === 'completada';
  const alternar = crearBoton(
    completada ? '↩ Desmarcar' : '✔ Completar',
    completada ? 'btn-contorno btn-desmarcar' : 'btn-contorno btn-completar',
    () => alternarCompletada(tarea.id)
  );
  alternar.setAttribute('aria-pressed', String(completada));
  acciones.appendChild(alternar);
  acciones.appendChild(crearBoton('🗑 Eliminar', 'btn-contorno', () => eliminarTarea(tarea.id)));
  return acciones;
}

/** Tarjeta de tarea (componente Card de Bootstrap con estilos propios). */
function crearTarjeta(tarea, animar) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-xl-4';

  const card = document.createElement('article');
  card.className = 'tarea-card tilt est-' + tarea.status + (animar ? ' aparece' : '');

  const nombre = document.createElement('h3');
  nombre.className = 'tarea-nombre';
  nombre.textContent = tarea.name;

  const desc = document.createElement('p');
  desc.className = 'tarea-desc';
  desc.textContent = tarea.description;

  const fecha = document.createElement('div');
  fecha.className = 'tarea-fecha';
  fecha.textContent = '📅 Entrega: ' + formatearFecha(tarea.date);

  const palo = { pendiente: '♥', progreso: '♦', completada: '♠' }[tarea.status];
  const esquinaSup = document.createElement('span');
  esquinaSup.className = 'palo tl';
  esquinaSup.textContent = palo;
  const esquinaInf = document.createElement('span');
  esquinaInf.className = 'palo br';
  esquinaInf.textContent = palo;

  card.append(esquinaSup, esquinaInf, crearBadges(tarea), nombre, desc, fecha, crearAcciones(tarea));
  activarTilt(card);
  col.appendChild(card);
  return col;
}

/** Elemento de la lista de tareas (List group de Bootstrap). */
function crearItemLista(tarea, animar) {
  const item = document.createElement('li');
  item.className = 'list-group-item est-' + tarea.status + (animar ? ' aparece' : '');

  const info = document.createElement('div');
  info.className = 'item-info';

  const nombre = document.createElement('strong');
  nombre.textContent = tarea.name;

  const detalle = document.createElement('div');
  detalle.className = 'texto-suave small';
  detalle.textContent = tarea.description + ' · 📅 ' + formatearFecha(tarea.date);

  info.append(nombre, detalle);

  const derecha = document.createElement('div');
  derecha.className = 'd-flex flex-wrap align-items-center gap-2';
  derecha.append(crearBadges(tarea), crearAcciones(tarea));

  item.append(info, derecha);
  return item;
}

function renderizar(animarPrimera = false) {
  const visibles = tareas.filter(t => filtroActual === 'todas' || t.status === filtroActual);

  taskCards.innerHTML = '';
  taskList.innerHTML = '';

  visibles.forEach((tarea, indice) => {
    const animar = animarPrimera && indice === 0;
    taskCards.appendChild(crearTarjeta(tarea, animar));
    taskList.appendChild(crearItemLista(tarea, animar));
  });

  listaVacia.classList.toggle('d-none', visibles.length > 0);
  actualizarResumen();
}

function actualizarResumen() {
  const total = tareas.length;
  const cuenta = estado => tareas.filter(t => t.status === estado).length;
  const completadas = cuenta('completada');
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

  document.querySelector('#statTotal').textContent = total;
  document.querySelector('#statPendiente').textContent = cuenta('pendiente');
  document.querySelector('#statProgreso').textContent = cuenta('progreso');
  document.querySelector('#statCompletada').textContent = completadas;

  const barra = document.querySelector('#avanceBar');
  barra.style.width = porcentaje + '%';
  barra.textContent = porcentaje + '%';
  barra.parentElement.setAttribute('aria-valuenow', porcentaje);
}

/* ---------- Filtros y cambio de vista ---------- */
filtroTareas.addEventListener('click', evento => {
  const boton = evento.target.closest('[data-filtro]');
  if (!boton) return;
  filtroActual = boton.dataset.filtro;
  filtroTareas.querySelectorAll('.nav-link').forEach(b => b.classList.toggle('active', b === boton));
  renderizar();
});

function cambiarVista(vista) {
  vistaActual = vista;
  const esTarjetas = vista === 'tarjetas';
  taskCards.classList.toggle('d-none', !esTarjetas);
  taskList.classList.toggle('d-none', esTarjetas);
  vistaTarjetasBtn.classList.toggle('active', esTarjetas);
  vistaListaBtn.classList.toggle('active', !esTarjetas);
}

vistaTarjetasBtn.addEventListener('click', () => cambiarVista('tarjetas'));
vistaListaBtn.addEventListener('click', () => cambiarVista('lista'));

/* ---------- Toast ---------- */
function mostrarToast(mensaje) {
  document.querySelector('#toastTexto').textContent = mensaje;
  const toast = bootstrap.Toast.getOrCreateInstance(document.querySelector('#toastOk'), { delay: 3200 });
  toast.show();
}

/* ==========================================================
   4. EFECTOS 3D (tilt y parallax)
   ========================================================== */

function activarTilt(elemento) {
  elemento.addEventListener('mousemove', e => {
    const caja = elemento.getBoundingClientRect();
    const x = (e.clientX - caja.left) / caja.width - 0.5;
    const y = (e.clientY - caja.top) / caja.height - 0.5;
    elemento.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`;
  });
  elemento.addEventListener('mouseleave', () => {
    elemento.style.transform = '';
  });
}

document.querySelectorAll('.tilt').forEach(activarTilt);

const capas = document.querySelectorAll('.capa');
document.addEventListener('mousemove', e => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  capas.forEach(capa => {
    const profundidad = parseFloat(capa.dataset.depth);
    const dx = (e.clientX - cx) * profundidad;
    const dy = (e.clientY - cy) * profundidad;
    capa.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  });
});

/* ==========================================================
   5. FRASES DE ÁNIMO, REFLEXIÓN E INSPIRACIÓN
   ========================================================== */

const frases = [
  { tipo: 'Ánimo', texto: 'Hoy es un gran día para empezar eso que tanto has postergado.' },
  { tipo: 'Ánimo', texto: 'No necesitas verlo todo claro, solo dar el siguiente paso.' },
  { tipo: 'Ánimo', texto: 'Tu esfuerzo de hoy es la sorpresa feliz de tu futuro.' },
  { tipo: 'Reflexión', texto: 'A veces, lo imposible solo está esperando a que alguien lo intente.' },
  { tipo: 'Reflexión', texto: 'Descansar también es avanzar: afila la mente para volver con más fuerza.' },
  { tipo: 'Reflexión', texto: 'Los errores no son el final del camino, son parte del mapa.' },
  { tipo: 'Inspiración', texto: 'Imagina seis cosas imposibles antes del desayuno y haz una de ellas realidad.' },
  { tipo: 'Inspiración', texto: 'Los grandes proyectos nacen como una idea pequeña y terca.' },
  { tipo: 'Inspiración', texto: 'Crea algo nuevo hoy: el mundo todavía tiene espacio para tu idea.' },
  { tipo: 'Inspiración', texto: 'Cada línea de código es una puerta nueva. Atrévete a abrirla.' }
];

const fraseTexto = document.querySelector('#fraseTexto');
const fraseTipo = document.querySelector('#fraseTipo');
let indiceFrase = Math.floor(Math.random() * frases.length);

function mostrarFrase() {
  fraseTexto.classList.add('saliendo');
  setTimeout(() => {
    const frase = frases[indiceFrase];
    fraseTipo.textContent = frase.tipo;
    fraseTexto.textContent = frase.texto;
    fraseTexto.classList.remove('saliendo');
    indiceFrase = (indiceFrase + 1) % frases.length;
  }, 350);
}

document.querySelector('#nuevaFraseBtn').addEventListener('click', () => {
  mostrarFrase();
  reiniciarRotacion();
});

let temporizadorFrases;
function reiniciarRotacion() {
  clearInterval(temporizadorFrases);
  temporizadorFrases = setInterval(mostrarFrase, 12000);
}

/* ==========================================================
   6. MÚSICA AMBIENTAL Y EFECTOS DE SONIDO (Web Audio API)
   Todo se genera en el navegador: no hay archivos de audio.
   ========================================================== */

const musicToggleBtn = document.querySelector('#musicToggleBtn');
const volumeRange = document.querySelector('#volumeRange');
const trackSelect = document.querySelector('#trackSelect');

let audioCtx = null;
let masterGain = null;
let temporizadorMusica = null;
let pasoActual = 0;

const aFrecuencia = midi => 440 * Math.pow(2, (midi - 69) / 12);

// Tres melodías: cada una con su ritmo, acordes y melodía por pasos (0 = silencio)
const pistas = [
  {
    nombre: 'Vals del té',
    segundosPorPaso: 0.28,
    pasosPorCompas: 6,
    acordes: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
    melodia: [72, 0, 76, 0, 79, 0,  81, 0, 79, 76, 72, 0,  77, 0, 81, 0, 84, 0,  83, 0, 79, 74, 67, 0],
    estilo: 'vals'
  },
  {
    nombre: 'Madriguera',
    segundosPorPaso: 0.5,
    pasosPorCompas: 8,
    acordes: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
    melodia: [76, 0, 0, 72, 0, 0, 69, 0,  77, 0, 0, 74, 0, 0, 72, 0,  79, 0, 76, 0, 72, 0, 0, 0,  74, 0, 0, 71, 0, 67, 0, 0],
    estilo: 'pad'
  },
  {
    nombre: 'Jardín de rosas',
    segundosPorPaso: 0.2,
    pasosPorCompas: 8,
    acordes: [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]],
    melodia: [78, 81, 86, 81, 78, 81, 86, 81,  83, 86, 90, 86, 83, 86, 90, 86,
              79, 83, 86, 83, 79, 83, 86, 83,  81, 85, 88, 85, 81, 85, 88, 85],
    estilo: 'arpegio'
  },
  {
    nombre: 'Piano sereno',
    segundosPorPaso: 0.55,
    pasosPorCompas: 8,
    acordes: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
    melodia: [76, 0, 0, 0, 79, 0, 76, 0,  72, 0, 0, 0, 76, 0, 74, 0,
              77, 0, 0, 0, 81, 0, 79, 0,  74, 0, 0, 0, 79, 0, 71, 0],
    estilo: 'piano',
    mano: 'arpegio'
  },
  {
    nombre: 'Piano alegre',
    segundosPorPaso: 0.21,
    pasosPorCompas: 8,
    acordes: [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]],
    melodia: [76, 79, 84, 79, 76, 79, 84, 0,  74, 79, 83, 79, 74, 79, 83, 0,
              76, 81, 84, 81, 76, 81, 84, 0,  77, 81, 84, 81, 77, 81, 84, 0],
    estilo: 'piano',
    mano: 'rebote'
  },
  {
    nombre: 'Violín soñador',
    segundosPorPaso: 0.5,
    pasosPorCompas: 8,
    acordes: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
    melodia: [81, 0, 0, 0, 79, 0, 76, 0,  77, 0, 0, 0, 76, 0, 72, 0,
              84, 0, 0, 0, 83, 0, 79, 0,  79, 0, 0, 0, 74, 0, 71, 0],
    estilo: 'violin',
    mano: 'arpegio'
  },
  {
    nombre: 'Violín festivo',
    segundosPorPaso: 0.22,
    pasosPorCompas: 8,
    acordes: [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]],
    melodia: [79, 0, 84, 0, 83, 84, 86, 0,  83, 0, 79, 0, 81, 83, 86, 0,
              84, 0, 81, 0, 83, 84, 88, 0,  84, 0, 81, 0, 79, 81, 84, 0],
    estilo: 'violin',
    mano: 'rebote'
  }
];

let pistaActual = pistas[3];

/** Crea el contexto de audio la primera vez (los navegadores exigen un clic antes). */
function asegurarAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = volumeRange.value / 100;

  // Eco suave para dar sensación de sala amplia
  const eco = audioCtx.createDelay(1);
  eco.delayTime.value = 0.34;
  const retroalimentacion = audioCtx.createGain();
  retroalimentacion.gain.value = 0.35;
  const mezclaEco = audioCtx.createGain();
  mezclaEco.gain.value = 0.3;

  masterGain.connect(audioCtx.destination);
  masterGain.connect(eco);
  eco.connect(retroalimentacion);
  retroalimentacion.connect(eco);
  eco.connect(mezclaEco);
  mezclaEco.connect(audioCtx.destination);
}

/** Nota tipo cajita de música: tono puro + armónico que se apaga rápido. */
function tocarCampana(midi, duracion, volumen, cuando) {
  const t = cuando || audioCtx.currentTime;
  [[1, 1], [2.76, 0.25]].forEach(([multiplo, peso]) => {
    const osc = audioCtx.createOscillator();
    const gan = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = aFrecuencia(midi) * multiplo;
    gan.gain.setValueAtTime(0.0001, t);
    gan.gain.exponentialRampToValueAtTime(volumen * peso, t + 0.015);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(gan);
    gan.connect(masterGain);
    osc.start(t);
    osc.stop(t + duracion + 0.05);
  });
}

/** Nota de piano: fundamental + armónicos con ataque rápido y caída natural. */
function tocarPiano(midi, duracion, volumen) {
  const t = audioCtx.currentTime;
  const filtro = audioCtx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 2600;
  filtro.connect(masterGain);

  [[1, 1, 'sine'], [2, 0.4, 'sine'], [3, 0.15, 'triangle'], [4, 0.06, 'sine']].forEach(([multiplo, peso, tipo]) => {
    const osc = audioCtx.createOscillator();
    const gan = audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.value = aFrecuencia(midi) * multiplo;
    gan.gain.setValueAtTime(0.0001, t);
    gan.gain.exponentialRampToValueAtTime(volumen * peso, t + 0.008);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(gan);
    gan.connect(filtro);
    osc.start(t);
    osc.stop(t + duracion + 0.05);
  });
}

/** Nota de violín: cuerda frotada (diente de sierra filtrado) con vibrato. */
function tocarViolin(midi, duracion, volumen) {
  const t = audioCtx.currentTime;
  const filtro = audioCtx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 2800;
  filtro.Q.value = 1.2;

  const gan = audioCtx.createGain();
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.linearRampToValueAtTime(volumen, t + Math.min(0.15, duracion * 0.3)); // ataque del arco
  gan.gain.setValueAtTime(volumen, t + duracion * 0.7);
  gan.gain.linearRampToValueAtTime(0.0001, t + duracion);
  filtro.connect(gan);
  gan.connect(masterGain);

  // Vibrato: oscilación lenta del tono, entra poco a poco
  const vibrato = audioCtx.createOscillator();
  const profundidad = audioCtx.createGain();
  vibrato.frequency.value = 5.5;
  profundidad.gain.setValueAtTime(0, t);
  profundidad.gain.linearRampToValueAtTime(9, t + 0.5);   // en cents
  vibrato.connect(profundidad);
  vibrato.start(t);
  vibrato.stop(t + duracion + 0.05);

  [-4, 4].forEach(desafine => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = aFrecuencia(midi);
    osc.detune.value = desafine;
    profundidad.connect(osc.detune);
    osc.connect(filtro);
    osc.start(t);
    osc.stop(t + duracion + 0.05);
  });
}

/** Cuántos segundos dura una nota de la melodía hasta que empieza la siguiente. */
function duracionHastaSiguiente(p, indice) {
  let pasos = 1;
  while (p.melodia[(indice + pasos) % p.melodia.length] === 0 && pasos < p.melodia.length) pasos++;
  return Math.min(pasos * p.segundosPorPaso, 3.2);
}

/** Nota larga y suave para los acordes de fondo. */
function tocarAlmohadilla(midi, duracion, volumen) {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gan = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = aFrecuencia(midi);
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.linearRampToValueAtTime(volumen, t + duracion * 0.3);
  gan.gain.linearRampToValueAtTime(0.0001, t + duracion);
  osc.connect(gan);
  gan.connect(masterGain);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
}

function siguientePaso() {
  const p = pistaActual;
  const enCompas = pasoActual % p.pasosPorCompas;
  const compas = Math.floor(pasoActual / p.pasosPorCompas) % p.acordes.length;
  const acorde = p.acordes[compas];
  const nota = p.melodia[pasoActual % p.melodia.length];

  if (nota) {
    if (p.estilo === 'piano') tocarPiano(nota, 2, 0.3);
    else if (p.estilo === 'violin') tocarViolin(nota, duracionHastaSiguiente(p, pasoActual % p.melodia.length), 0.2);
    else tocarCampana(nota, p.estilo === 'pad' ? 2.4 : 1.2, 0.28);
  }

  if (p.estilo === 'piano' || p.estilo === 'violin') {
    if (p.mano === 'arpegio') {
      // Mano izquierda calmada: bajo y acorde roto
      if (enCompas === 0) tocarPiano(acorde[0] - 12, 2.5, 0.28);
      if (enCompas % 2 === 0) tocarPiano(acorde[(enCompas / 2) % acorde.length] + 12, 1.6, 0.16);
    } else {
      // Mano izquierda alegre: bajo y acordes con rebote
      if (enCompas === 0) tocarPiano(acorde[0] - 12, 0.9, 0.3);
      if (enCompas === 2 || enCompas === 4 || enCompas === 6) acorde.forEach(m => tocarPiano(m, 0.5, 0.1));
    }
  } else if (p.estilo === 'vals') {
    if (enCompas === 0) tocarAlmohadilla(acorde[0] - 12, 0.9, 0.3);       // bajo
    if (enCompas === 2 || enCompas === 4) acorde.forEach(m => tocarCampana(m + 12, 0.6, 0.1));
  } else if (p.estilo === 'pad') {
    if (enCompas === 0) acorde.forEach(m => tocarAlmohadilla(m, p.segundosPorPaso * 8, 0.12));
  } else {
    if (enCompas === 0) tocarAlmohadilla(acorde[0] - 12, 1.4, 0.28);
    if (enCompas === 4) acorde.forEach(m => tocarCampana(m + 12, 0.8, 0.08));
  }
  pasoActual++;
}

function iniciarMusica() {
  asegurarAudio();
  clearInterval(temporizadorMusica);
  temporizadorMusica = setInterval(siguientePaso, pistaActual.segundosPorPaso * 1000);
  musicToggleBtn.classList.add('sonando');
  musicToggleBtn.setAttribute('aria-pressed', 'true');
  musicToggleBtn.textContent = '⏸ Pausar';
}

function detenerMusica() {
  clearInterval(temporizadorMusica);
  temporizadorMusica = null;
  musicToggleBtn.classList.remove('sonando');
  musicToggleBtn.setAttribute('aria-pressed', 'false');
  musicToggleBtn.textContent = '🎵 Música';
}

musicToggleBtn.addEventListener('click', () => {
  if (temporizadorMusica) detenerMusica();
  else iniciarMusica();
});

trackSelect.addEventListener('change', () => {
  pistaActual = pistas[Number(trackSelect.value)];
  pasoActual = 0;
  if (temporizadorMusica) iniciarMusica();
  mostrarToast('Sonando: ' + pistaActual.nombre + ' 🎶');
});

volumeRange.addEventListener('input', () => {
  if (masterGain) masterGain.gain.value = volumeRange.value / 100;
});

/* ---------- Efectos de sonido ---------- */
function sonidoClic() {
  asegurarAudio();
  tocarCampana(88, 0.35, 0.18);
}

function sonidoExito() {
  asegurarAudio();
  const t = audioCtx.currentTime;
  [72, 76, 79, 84].forEach((m, i) => tocarCampana(m, 0.8, 0.22, t + i * 0.09));
}

function sonidoError() {
  asegurarAudio();
  const t = audioCtx.currentTime;
  tocarCampana(60, 0.7, 0.25, t);
  tocarCampana(55, 0.9, 0.25, t + 0.18);
}

document.addEventListener('click', evento => {
  if (evento.target.closest('.btn:not(.btn-dorado)')) sonidoClic();
});

/* ==========================================================
   7. DESTELLOS, ESTELA DEL CURSOR Y CONFETI
   ========================================================== */

const lienzo = document.querySelector('#destellos');
const pincel = lienzo.getContext('2d');
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const colores = ['#ffc857', '#ff6fb1', '#35d0c3', '#ffffff', '#b794f6'];
let particulas = [];

function ajustarLienzo() {
  lienzo.width = window.innerWidth;
  lienzo.height = window.innerHeight;
}
window.addEventListener('resize', ajustarLienzo);
ajustarLienzo();

function crearParticula(x, y, opciones = {}) {
  particulas.push({
    x, y,
    vx: opciones.vx ?? (Math.random() - 0.5) * 0.6,
    vy: opciones.vy ?? -Math.random() * 0.6 - 0.2,
    vida: opciones.vida ?? 1,
    desgaste: opciones.desgaste ?? 0.012,
    tamano: opciones.tamano ?? Math.random() * 3 + 1.5,
    color: colores[Math.floor(Math.random() * colores.length)],
    gravedad: opciones.gravedad ?? 0
  });
}

function confeti(x, y) {
  if (reducirMovimiento) return;
  for (let i = 0; i < 70; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const fuerza = Math.random() * 6 + 2;
    crearParticula(x, y, {
      vx: Math.cos(angulo) * fuerza,
      vy: Math.sin(angulo) * fuerza - 3,
      tamano: Math.random() * 5 + 2.5,
      desgaste: 0.01,
      gravedad: 0.12
    });
  }
}

function animarParticulas() {
  pincel.clearRect(0, 0, lienzo.width, lienzo.height);

  // Polvo dorado ambiental
  if (!reducirMovimiento && particulas.length < 140 && Math.random() < 0.25) {
    crearParticula(Math.random() * lienzo.width, lienzo.height + 10, { vy: -Math.random() * 0.8 - 0.3, desgaste: 0.003 });
  }

  particulas = particulas.filter(p => p.vida > 0);
  particulas.forEach(p => {
    p.x += p.vx;
    p.vy += p.gravedad;
    p.y += p.vy;
    p.vida -= p.desgaste;

    pincel.globalAlpha = Math.max(p.vida, 0);
    pincel.fillStyle = p.color;
    pincel.shadowColor = p.color;
    pincel.shadowBlur = 10;
    pincel.beginPath();
    pincel.arc(p.x, p.y, p.tamano, 0, Math.PI * 2);
    pincel.fill();
  });
  pincel.globalAlpha = 1;
  requestAnimationFrame(animarParticulas);
}

// Estela de destellos que sigue al cursor
document.addEventListener('mousemove', e => {
  if (reducirMovimiento || Math.random() > 0.35) return;
  crearParticula(e.clientX, e.clientY, { vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2, desgaste: 0.035 });
});

animarParticulas();

/* ==========================================================
   8. RELOJ EN VIVO
   ========================================================== */

const manecillaHora = document.querySelector('#manecillaHora');
const manecillaMin = document.querySelector('#manecillaMin');
const manecillaSeg = document.querySelector('#manecillaSeg');
const horaTexto = document.querySelector('#horaTexto');

function dibujarMarcasReloj() {
  const grupo = document.querySelector('#relojMarcas');
  let marcas = '';
  for (let i = 0; i < 60; i++) {
    const esHora = i % 5 === 0;
    const largo = esHora ? 12 : 5;
    marcas += `<line x1="100" y1="${100 - 84 + 3}" x2="100" y2="${100 - 84 + 3 + largo}" ` +
      `class="${esHora ? 'marca-hora' : 'marca-min'}" transform="rotate(${i * 6} 100 100)"/>`;
  }
  grupo.innerHTML = marcas;
}

function actualizarReloj() {
  const ahora = new Date();
  const seg = ahora.getSeconds();
  const min = ahora.getMinutes() + seg / 60;
  const hora = (ahora.getHours() % 12) + min / 60;

  manecillaSeg.setAttribute('transform', `rotate(${seg * 6} 100 100)`);
  manecillaMin.setAttribute('transform', `rotate(${min * 6} 100 100)`);
  manecillaHora.setAttribute('transform', `rotate(${hora * 30} 100 100)`);

  const texto = ahora.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  horaTexto.textContent = `Son las ${texto}: siempre es buen momento para crear algo nuevo.`;
}

dibujarMarcasReloj();
actualizarReloj();
setInterval(actualizarReloj, 1000);

/* ==========================================================
   9. APARICIÓN AL HACER SCROLL
   ========================================================== */

const observador = new IntersectionObserver(entradas => {
  entradas.forEach(entrada => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visible');
      observador.unobserve(entrada.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.revelar').forEach(el => observador.observe(el));

/* ==========================================================
   Inicio
   ========================================================== */
mostrarFrase();
reiniciarRotacion();
renderizar();

/* ==========================================================
   10. REPRODUCTOR PROPIO (archivo de audio del usuario)
   ========================================================== */

const archivoMusica = document.querySelector('#archivoMusica');
const audioPropio = document.querySelector('#audioPropio');
const nombrePista = document.querySelector('#nombrePista');
let urlAudioPropio = null;

archivoMusica.addEventListener('change', () => {
  const archivo = archivoMusica.files[0];
  if (!archivo) return;

  if (urlAudioPropio) URL.revokeObjectURL(urlAudioPropio);
  urlAudioPropio = URL.createObjectURL(archivo);

  audioPropio.src = urlAudioPropio;
  audioPropio.hidden = false;
  nombrePista.textContent = 'Reproduciendo: ' + archivo.name;
  audioPropio.play().catch(() => { /* el usuario puede darle play manualmente */ });
});

// Solo suena una fuente a la vez: el audio propio o la música de la página
audioPropio.addEventListener('play', () => {
  if (temporizadorMusica) detenerMusica();
});
musicToggleBtn.addEventListener('click', () => {
  if (!audioPropio.paused) audioPropio.pause();
});
