const mapaMesas = document.querySelector('#mapa-mesas');
const mapaMesasModal = document.querySelector('#mapa-mesas-modal');
const listaReservas = document.querySelector('#lista-reservas');
const reloadButton = document.querySelector('#reload');
const openReservationCta = document.querySelector('#open-reservation-cta');
const reservaModal = document.querySelector('#reserva-modal');
const mesaModal = document.querySelector('#mesa-modal');
const reservaForm = document.querySelector('#reserva-form');
const filtersForm = document.querySelector('#filters-form');
const clearFiltersButton = document.querySelector('#clear-filters');
const filterCliente = document.querySelector('#filter-cliente');
const filterMesa = document.querySelector('#filter-mesa');
const filterData = document.querySelector('#filter-data');
const filterStatus = document.querySelector('#filter-status');
const reservaIdInput = document.querySelector('#reserva-id');
const dataInput = document.querySelector('#data-reserva');
const horaInput = document.querySelector('#hora-reserva');
const pessoasInput = document.querySelector('#quantidade-pessoas');
const mesaInput = document.querySelector('#numero-mesa');
const mesaSummaryEmpty = document.querySelector('#mesa-summary-empty');
const mesaSummaryContent = document.querySelector('#mesa-summary-content');
const mesaSummaryNumber = document.querySelector('#mesa-summary-number');
const mesaSummaryMeta = document.querySelector('#mesa-summary-meta');
const miniMapBlock = document.querySelector('#mini-map-block');
const toggleMapBtn = document.querySelector('#toggle-map-btn');
const modalEyebrow = document.querySelector('#modal-eyebrow');
const modalTitle = document.querySelector('#modal-title');
const nomeInput = document.querySelector('#nome-cliente');
const telefoneInput = document.querySelector('#telefone-cliente');
const observacoesInput = document.querySelector('#observacoes');
const cancelEditButton = document.querySelector('#cancel-edit');
const mesaModalTitle = document.querySelector('#mesa-modal-title');
const mesaModalBody = document.querySelector('#mesa-modal-body');
const mesaReserveBtn = document.querySelector('#mesa-reserve-btn');
const pageTitle = document.querySelector('#page-title');
const pageSubtitle = document.querySelector('#page-subtitle');
const flashContainer = document.querySelector('#flash-container');
const navItems = document.querySelectorAll('.nav-item');
const sectionMapa = document.querySelector('#section-mapa');
const sectionReservas = document.querySelector('#section-reservas');

let mesasCache = [];
let reservasCache = [];
let mesaSelecionadaAtual = '';
let mesaDetalheAtual = null;

const FLASH_ICONS = {
  success: '✓',
  error: '!',
  info: 'i'
};

const FLASH_TITLES = {
  success: 'Sucesso',
  error: 'Erro',
  info: 'Informação'
};

function showFlash(message, type = 'info', duration = 4500) {
  if (!flashContainer || !message) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = `flash ${type}`;
  toast.innerHTML = `
    <span class="flash-icon" aria-hidden="true">${FLASH_ICONS[type] ?? 'i'}</span>
    <div class="flash-body">
      <p class="flash-title">${FLASH_TITLES[type] ?? 'Aviso'}</p>
      <p class="flash-message">${message}</p>
    </div>
    <button type="button" class="flash-close" aria-label="Fechar aviso">×</button>
  `;

  const removeToast = () => {
    toast.remove();
  };

  toast.querySelector('.flash-close')?.addEventListener('click', removeToast);
  flashContainer.appendChild(toast);

  window.setTimeout(removeToast, duration);
}

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function formatDateMask(value) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateMask(value) {
  const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function dateToMask(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function maskToApiDate(value) {
  const date = parseDateMask(value);
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function buildLocalDateTime(dateValue, timeValue) {
  const date = parseDateMask(dateValue);
  if (!date) {
    return null;
  }

  const [hours, minutes] = String(timeValue).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

function populateTimeOptions(selected = '19:30') {
  const slots = [];

  for (let hour = 11; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 23 && minute === 30) {
        continue;
      }

      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  if (selected && !slots.includes(selected)) {
    slots.push(selected);
    slots.sort();
  }

  horaInput.innerHTML = slots.map((value) => `<option value="${value}">${value}</option>`).join('');
  horaInput.value = slots.includes(selected) ? selected : '19:30';
}

function bindDateMask(input) {
  input?.addEventListener('input', () => {
    const cursorFromEnd = input.value.length - input.selectionStart;
    input.value = formatDateMask(input.value);
    const nextPosition = Math.max(input.value.length - cursorFromEnd, 0);
    input.setSelectionRange(nextPosition, nextPosition);
  });
}

function bindPhoneMask(input) {
  input?.addEventListener('input', () => {
    input.value = formatPhone(input.value);
  });
}

function statusClass(status) {
  if (status === 'ocupado' || status === 'occupied') return 'occupied';
  if (status === 'reservado' || status === 'reserved') return 'reserved';
  return 'available';
}

function getPrettyStatus(status) {
  if (status === 'occupied' || status === 'ocupado') return 'Ocupada';
  if (status === 'reserved' || status === 'reservado') return 'Reservada';
  if (status === 'finalizado') return 'Finalizada';
  if (status === 'cancelado') return 'Cancelada';
  return 'Disponível';
}

function groupMesasByZone(mesas = []) {
  return mesas.reduce((groups, mesa) => {
    const zone = mesa.localizacao || 'Salão';
    if (!groups[zone]) {
      groups[zone] = [];
    }
    groups[zone].push(mesa);
    return groups;
  }, {});
}

function renderChairs(capacity) {
  const count = Math.min(Math.max(capacity, 2), 4);
  return Array.from({ length: count }, () => '<span class="chair"></span>').join('');
}

function renderTableCard(mesa, compact = false) {
  const status = mesa.status || 'available';
  const cssStatus = statusClass(status);
  const selected = mesaSelecionadaAtual === String(mesa.numero) ? 'is-selected' : '';

  return `
    <button
      class="table-card ${selected}"
      type="button"
      data-status="${status}"
      data-mesa="${mesa.numero}"
      aria-label="Mesa ${mesa.numero}, ${getPrettyStatus(status)}"
    >
      <span class="table-chairs">${renderChairs(mesa.capacidade)}</span>
      <span class="table-number">${mesa.numero}</span>
      <span class="table-capacity">${mesa.capacidade} lugares</span>
      ${compact ? '' : `<span class="table-status-badge ${cssStatus}">${getPrettyStatus(status)}</span>`}
    </button>
  `;
}

function renderFloorPlan(container, mesas = [], compact = false) {
  if (!container) {
    return;
  }

  if (!mesas.length) {
    container.innerHTML = '<p class="empty-state">Cadastre mesas com <code>npm run seed:mesas</code> para visualizar o mapa.</p>';
    return;
  }

  const zones = groupMesasByZone(mesas);
  container.innerHTML = Object.entries(zones)
    .map(([zone, zoneMesas]) => {
      const disponiveis = zoneMesas.filter((mesa) => (mesa.status || 'available') === 'available').length;

      return `
        <section class="zone-block">
          <div class="zone-header">
            <div>
              <h3 class="zone-title">${zone}</h3>
              <p class="zone-meta">${zoneMesas.length} mesas · ${disponiveis} disponíveis</p>
            </div>
          </div>
          <div class="table-grid">
            ${zoneMesas.map((mesa) => renderTableCard(mesa, compact)).join('')}
          </div>
        </section>
      `;
    })
    .join('');
}

function updatePessoasOptions(maxCapacity = 8) {
  const options = [];
  for (let value = 1; value <= maxCapacity; value += 1) {
    options.push(`<option value="${value}">${value} ${value === 1 ? 'pessoa' : 'pessoas'}</option>`);
  }

  pessoasInput.innerHTML = options.join('');
  pessoasInput.value = String(Math.min(4, maxCapacity));
}

function updateFilterMesaOptions(mesas = []) {
  const current = filterMesa.value;
  filterMesa.innerHTML = `
    <option value="">Todas</option>
    ${mesas.map((mesa) => `<option value="${mesa.numero}">Mesa ${mesa.numero}</option>`).join('')}
  `;
  filterMesa.value = current;
}

function renderReservas(reservas = []) {
  listaReservas.innerHTML = reservas.length
    ? reservas.map((reserva) => `
        <article class="reservation-card">
          <div class="reservation-top">
            <div>
              <div class="reservation-title">${reserva.nomeCliente}</div>
              <div class="reservation-meta">Mesa ${reserva.numeroMesa} · ${reserva.quantidadePessoas} pessoas</div>
              <div class="reservation-meta">${formatDateTime(reserva.dataHoraReserva)} · ${reserva.duracaoMinutos} min</div>
            </div>
            <span class="pill ${statusClass(reserva.status)}">${getPrettyStatus(reserva.status)}</span>
          </div>
          <div class="reservation-meta">${formatPhone(reserva.contatoCliente)}</div>
          <div class="reservation-meta">${reserva.observacoes || 'Sem observações'}</div>
          <div class="form-actions" style="margin-top: 12px;">
            <button type="button" class="secondary" data-edit="${reserva._id}">Editar</button>
            <button type="button" class="ghost" data-cancel="${reserva._id}">Cancelar</button>
          </div>
        </article>
      `).join('')
    : '<p class="empty-state">Nenhuma reserva encontrada para os filtros selecionados.</p>';
}

function updateMesaSummaryUI(options = {}) {
  const { showMap = false } = options;
  const mesa = mesasCache.find((item) => String(item.numero) === mesaInput.value);

  if (!mesa) {
    mesaSummaryEmpty?.classList.remove('hidden');
    mesaSummaryContent?.classList.add('hidden');
    miniMapBlock?.classList.remove('collapsed');
    return;
  }

  mesaSummaryEmpty?.classList.add('hidden');
  mesaSummaryContent?.classList.remove('hidden');
  mesaSummaryNumber.textContent = `Mesa ${mesa.numero}`;
  mesaSummaryMeta.textContent = `${mesa.localizacao} · até ${mesa.capacidade} pessoas`;

  if (showMap) {
    miniMapBlock?.classList.remove('collapsed');
  } else {
    miniMapBlock?.classList.add('collapsed');
  }
}

function setReservationModalMode(isEditing = false) {
  if (isEditing) {
    modalEyebrow.textContent = 'Editar reserva';
    modalTitle.textContent = 'Atualizar reserva';
    return;
  }

  modalEyebrow.textContent = 'Nova reserva';
  modalTitle.textContent = 'Confirmar reserva';
}

function openReservationForMesa(mesaNumero) {
  const numero = Number(mesaNumero);
  closeMesaModal();
  resetForm();
  selectMesaForReservation(numero);
  updateMesaSummaryUI({ showMap: false });
  openReservaModal();
  showFlash(`Mesa ${numero} selecionada. Preencha os dados da reserva.`, 'info');
}

function openReservaModal() {
  reservaModal?.classList.remove('hidden');
  reservaModal?.setAttribute('aria-hidden', 'false');
}

function closeReservaModal() {
  reservaModal?.classList.add('hidden');
  reservaModal?.setAttribute('aria-hidden', 'true');
}

function openMesaModal() {
  mesaModal?.classList.remove('hidden');
  mesaModal?.setAttribute('aria-hidden', 'false');
}

function closeMesaModal() {
  mesaModal?.classList.add('hidden');
  mesaModal?.setAttribute('aria-hidden', 'true');
  mesaDetalheAtual = null;
}

function updateSelectedMesaLabel() {
  updateMesaSummaryUI({ showMap: !mesaInput.value });
}

function setDefaultDateTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dataInput.value = dateToMask(tomorrow);
  populateTimeOptions('19:30');
}

function resetForm() {
  reservaIdInput.value = '';
  nomeInput.value = '';
  telefoneInput.value = '';
  observacoesInput.value = '';
  mesaInput.value = '';
  mesaSelecionadaAtual = '';
  setDefaultDateTime();
  updatePessoasOptions(8);
  setReservationModalMode(false);
  updateMesaSummaryUI({ showMap: true });
  cancelEditButton.classList.add('hidden');
  renderFloorPlan(mapaMesas, mesasCache);
  renderFloorPlan(mapaMesasModal, mesasCache, true);
}

function populateForm(reserva) {
  const date = new Date(reserva.dataHoraReserva);
  const timeValue = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  reservaIdInput.value = reserva._id;
  dataInput.value = dateToMask(date);
  populateTimeOptions(timeValue);
  horaInput.value = timeValue;
  mesaInput.value = String(reserva.numeroMesa);
  mesaSelecionadaAtual = String(reserva.numeroMesa);
  nomeInput.value = reserva.nomeCliente;
  telefoneInput.value = formatPhone(reserva.contatoCliente);
  observacoesInput.value = reserva.observacoes || '';

  const mesa = mesasCache.find((item) => item.numero === reserva.numeroMesa);
  updatePessoasOptions(mesa?.capacidade ?? 8);
  pessoasInput.value = String(reserva.quantidadePessoas);

  cancelEditButton.classList.remove('hidden');
  setReservationModalMode(true);
  showFlash(`Editando reserva da mesa ${reserva.numeroMesa}.`, 'info');
  updateMesaSummaryUI({ showMap: false });
  renderFloorPlan(mapaMesas, mesasCache);
  renderFloorPlan(mapaMesasModal, mesasCache, true);
  openReservaModal();
}

function buildReservasQuery() {
  const params = new URLSearchParams();

  if (filterCliente.value.trim()) {
    params.set('cliente', filterCliente.value.trim());
  }

  if (filterMesa.value) {
    params.set('mesa', filterMesa.value);
  }

  const apiDate = maskToApiDate(filterData.value);
  if (apiDate) {
    params.set('data', apiDate);
  }

  if (filterStatus.value) {
    params.set('status', filterStatus.value);
  }

  const query = params.toString();
  return query ? `/api/reservas?${query}` : '/api/reservas';
}

async function loadData(options = {}) {
  const { silent = false } = options;
  const [mesasResponse, reservasResponse] = await Promise.all([
    fetch('/api/mesas'),
    fetch(buildReservasQuery())
  ]);

  if (!mesasResponse.ok || !reservasResponse.ok) {
    showFlash('Não foi possível carregar os dados. Verifique se o servidor e o MongoDB estão ativos.', 'error');
    return false;
  }

  mesasCache = await mesasResponse.json();
  reservasCache = await reservasResponse.json();

  updateFilterMesaOptions(mesasCache);
  renderFloorPlan(mapaMesas, mesasCache);
  renderFloorPlan(mapaMesasModal, mesasCache, true);
  renderReservas(reservasCache);

  if (!silent) {
    showFlash('Dados atualizados com sucesso.', 'success');
  }

  return true;
}

function showMesaDetails(mesa) {
  mesaDetalheAtual = mesa;
  mesaModalTitle.textContent = `Mesa ${mesa.numero}`;

  const reserva = mesa.reservaAtiva;
  const status = mesa.status || 'available';

  if (status === 'available') {
    mesaModalBody.innerHTML = `
      <div class="detail-highlight">
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value">${getPrettyStatus(status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Localização</span>
          <span class="detail-value">${mesa.localizacao}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Capacidade</span>
          <span class="detail-value">${mesa.capacidade} pessoas</span>
        </div>
      </div>
      <p class="empty-state">Esta mesa está livre. Você pode reservá-la agora.</p>
    `;
    mesaReserveBtn.classList.remove('hidden');
    mesaReserveBtn.textContent = 'Reservar esta mesa';
    openMesaModal();
    return;
  }

  if (!reserva) {
    mesaModalBody.innerHTML = `
      <div class="detail-highlight">
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value">${getPrettyStatus(status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Localização</span>
          <span class="detail-value">${mesa.localizacao}</span>
        </div>
      </div>
      <p class="empty-state">Não há reserva ativa vinculada a esta mesa no momento.</p>
    `;
    mesaReserveBtn.classList.add('hidden');
    openMesaModal();
    return;
  }

  mesaModalBody.innerHTML = `
    <div class="detail-highlight">
      <div class="detail-row">
        <span class="detail-label">Status da mesa</span>
        <span class="detail-value">${getPrettyStatus(status)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Cliente</span>
        <span class="detail-value">${reserva.nomeCliente ?? '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Contato</span>
        <span class="detail-value">${formatPhone(reserva.contatoCliente ?? '') || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Horário</span>
        <span class="detail-value">${formatDateTime(reserva.dataHoraReserva)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duração</span>
        <span class="detail-value">${reserva.duracaoMinutos ?? 90} minutos</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pessoas</span>
        <span class="detail-value">${reserva.quantidadePessoas ?? '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Observações</span>
        <span class="detail-value">${reserva.observacoes || 'Sem observações'}</span>
      </div>
    </div>
  `;

  mesaReserveBtn.classList.add('hidden');
  openMesaModal();
}

function selectMesaForReservation(mesaNumero) {
  const mesa = mesasCache.find((item) => String(item.numero) === String(mesaNumero));

  if (!mesa || mesa.status !== 'available') {
    return;
  }

  mesaSelecionadaAtual = String(mesa.numero);
  mesaInput.value = String(mesa.numero);
  updatePessoasOptions(mesa.capacidade);
  updateMesaSummaryUI({ showMap: false });
  renderFloorPlan(mapaMesas, mesasCache);
  renderFloorPlan(mapaMesasModal, mesasCache, true);
}

async function createOrUpdateReserva(event) {
  event.preventDefault();

  const numeroMesa = Number(mesaInput.value);
  if (!numeroMesa) {
    showFlash('Selecione uma mesa disponível no mapa.', 'error');
    return;
  }

  const reservationDate = buildLocalDateTime(dataInput.value, horaInput.value);
  if (!reservationDate) {
    showFlash('Informe uma data válida no formato DD/MM/AAAA.', 'error');
    return;
  }

  const phoneDigits = onlyDigits(telefoneInput.value);
  if (phoneDigits.length < 10) {
    showFlash('Informe um telefone válido com DDD.', 'error');
    return;
  }

  const payload = {
    nomeCliente: nomeInput.value.trim(),
    contatoCliente: formatPhone(telefoneInput.value),
    numeroMesa,
    quantidadePessoas: Number(pessoasInput.value),
    dataHoraReserva: reservationDate.toISOString(),
    observacoes: observacoesInput.value.trim(),
    duracaoMinutos: 90
  };

  const reservaId = reservaIdInput.value;
  const method = reservaId ? 'PATCH' : 'POST';
  const url = reservaId ? `/api/reservas/${reservaId}` : '/api/reservas';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    showFlash(data.message || 'Não foi possível salvar a reserva.', 'error');
    return;
  }

  showFlash(data.message || (reservaId ? 'Reserva atualizada com sucesso.' : 'Reserva criada com sucesso.'), 'success');
  resetForm();
  closeReservaModal();
  await loadData({ silent: true });
}

async function cancelReserva(id) {
  const response = await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
  const data = await response.json();

  if (!response.ok) {
    showFlash(data.message || 'Não foi possível cancelar a reserva.', 'error');
    return;
  }

  showFlash(data.message || 'Reserva cancelada com sucesso.', 'success');
  await loadData({ silent: true });
}

function editReserva(id) {
  const reserva = reservasCache.find((item) => item._id === id);
  if (!reserva) {
    showFlash('Reserva não encontrada.', 'error');
    return;
  }

  populateForm(reserva);
}

function switchSection(section) {
  const isMap = section === 'mapa';

  sectionMapa?.classList.toggle('active', isMap);
  sectionReservas?.classList.toggle('active', !isMap);

  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  if (isMap) {
    pageTitle.textContent = 'Mapa do salão';
    pageSubtitle.textContent = 'Clique em qualquer mesa para ver detalhes ou reservar.';
  } else {
    pageTitle.textContent = 'Reservas';
    pageSubtitle.textContent = 'Filtre por cliente, mesa, data ou status.';
  }
}

function bindTableSelection(container) {
  container?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mesa]');
    if (!button) {
      return;
    }

    const mesaNumero = button.getAttribute('data-mesa');
    const mesa = mesasCache.find((item) => String(item.numero) === mesaNumero);

    if (!mesa) {
      return;
    }

    if (container === mapaMesasModal) {
      if (mesa.status === 'available') {
        selectMesaForReservation(mesa.numero);
        toggleMapBtn.textContent = 'Alterar mesa';
        showFlash(`Mesa ${mesa.numero} selecionada.`, 'info');
      } else {
        showFlash(`A mesa ${mesa.numero} não está disponível para reserva.`, 'error');
      }
      return;
    }

    showMesaDetails(mesa);
  });
}

function bindEvents() {
  bindDateMask(dataInput);
  bindDateMask(filterData);
  bindPhoneMask(telefoneInput);

  reloadButton?.addEventListener('click', () => loadData());
  reservaForm?.addEventListener('submit', createOrUpdateReserva);
  cancelEditButton?.addEventListener('click', () => {
    resetForm();
    showFlash('Edição cancelada.', 'info');
  });

  openReservationCta?.addEventListener('click', () => {
    resetForm();
    openReservaModal();
  });

  toggleMapBtn?.addEventListener('click', () => {
    miniMapBlock?.classList.toggle('collapsed');
    const isCollapsed = miniMapBlock?.classList.contains('collapsed');
    toggleMapBtn.textContent = isCollapsed ? 'Alterar mesa' : 'Ocultar mapa';
  });

  filtersForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (filterData.value.trim() && !parseDateMask(filterData.value)) {
      showFlash('Informe uma data válida no filtro (DD/MM/AAAA).', 'error');
      return;
    }

    await loadData({ silent: true });
    showFlash('Filtros aplicados.', 'success');
  });

  clearFiltersButton?.addEventListener('click', async () => {
    filterCliente.value = '';
    filterMesa.value = '';
    filterData.value = '';
    filterStatus.value = '';
    await loadData({ silent: true });
    showFlash('Filtros removidos.', 'info');
  });

  listaReservas?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit]');
    const cancelButton = event.target.closest('[data-cancel]');

    if (editButton) {
      editReserva(editButton.getAttribute('data-edit'));
    }

    if (cancelButton) {
      cancelReserva(cancelButton.getAttribute('data-cancel'));
    }
  });

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      switchSection(item.dataset.section);
    });
  });

  document.querySelectorAll('[data-close-reserva-modal]').forEach((element) => {
    element.addEventListener('click', closeReservaModal);
  });

  document.querySelectorAll('[data-close-mesa-modal]').forEach((element) => {
    element.addEventListener('click', closeMesaModal);
  });

  mesaReserveBtn?.addEventListener('click', () => {
    if (!mesaDetalheAtual) {
      return;
    }

    openReservationForMesa(mesaDetalheAtual.numero);
  });

  bindTableSelection(mapaMesas);
  bindTableSelection(mapaMesasModal);
}

setDefaultDateTime();
updatePessoasOptions(8);
bindEvents();
loadData({ silent: true });
