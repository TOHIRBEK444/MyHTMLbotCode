const desktop = document.getElementById('desktop');
const desktopArea = document.getElementById('desktop-area');
const desktopIcons = document.getElementById('desktop-icons');
const selectionBox = document.getElementById('selection-box');
const desktopMenu = document.getElementById('desktop-menu');
const windowsLayer = document.getElementById('windows-layer');
const startMenu = document.getElementById('start-menu');
const startBtn = document.getElementById('start-btn');
const startShutdown = document.getElementById('start-shutdown');
const taskButtons = document.getElementById('task-buttons');
const clock = document.getElementById('clock');
const shutdownModal = document.getElementById('shutdown-modal');
const rebootScreen = document.getElementById('reboot-screen');
const poweroffScreen = document.getElementById('poweroff-screen');

const state = {
  z: 10,
  nextId: 100,
  selectedDesktopIds: new Set(),
  contextTargetId: null,
  openWindows: new Map(),
  entries: [
    { id: 1, type: 'file', name: 'Новый текстовый документ.txt', content: 'Привет из Windows XP Web', location: 'documents', previousLocation: null },
    { id: 2, type: 'file', name: 'План.txt', content: 'Список задач:\n- Рабочий стол\n- Приложения', location: 'documents', previousLocation: null },
    { id: 3, type: 'folder', name: 'Проекты', content: '', location: 'documents', previousLocation: null }
  ],
  desktopPositions: {}
};

const systemDesktopItems = [
  { id: 'sys-my-computer', type: 'system', appId: 'my-computer', name: 'Мой компьютер', icon: '💻' },
  { id: 'sys-recycle-bin', type: 'system', appId: 'recycle-bin', name: 'Корзина', icon: '🗑️' },
  { id: 'sys-my-documents', type: 'system', appId: 'my-documents', name: 'Мои документы', icon: '📁' },
  { id: 'sys-ie', type: 'system', appId: 'internet-explorer', name: 'Internet Explorer', icon: '🌐' }
];

const apps = {
  'my-computer': {
    title: 'Мой компьютер',
    icon: '💻',
    width: 650,
    height: 460,
    render: () => `
      <div class="pane">
        <div class="icon-grid">
          <div class="item"><span class="ico">💽</span><span>Локальный диск (C:)</span></div>
          <div class="item"><span class="ico">💽</span><span>Локальный диск (D:)</span></div>
          <div class="item"><span class="ico">📀</span><span>CD-дисковод (E:)</span></div>
        </div>
      </div>
    `
  },
  'my-documents': {
    title: 'Мои документы',
    icon: '📁',
    width: 740,
    height: 520,
    render: () => '<div class="pane" data-docs-pane="1"></div>',
    afterCreate: (win) => renderDocuments(win),
    onFocus: (win) => renderDocuments(win)
  },
  'recycle-bin': {
    title: 'Корзина',
    icon: '🗑️',
    width: 700,
    height: 470,
    render: () => '<div class="pane" data-bin-pane="1"></div>',
    afterCreate: (win) => renderRecycle(win),
    onFocus: (win) => renderRecycle(win)
  },
  notepad: {
    title: 'Блокнот',
    icon: '📝',
    width: 650,
    height: 500,
    render: () => `
      <div class="toolbar">Файл | Правка | Формат | Справка</div>
      <textarea class="textarea" spellcheck="false"></textarea>
    `
  },
  calculator: {
    title: 'Калькулятор',
    icon: '🧮',
    width: 340,
    height: 460,
    minWidth: 300,
    minHeight: 420,
    render: () => `
      <div class="calc">
        <input class="calc-display" value="0" readonly>
        <div class="calc-grid">
          <button class="calc-btn op" data-v="C" type="button">C</button>
          <button class="calc-btn op" data-v="÷" type="button">÷</button>
          <button class="calc-btn op" data-v="×" type="button">×</button>
          <button class="calc-btn op" data-v="-" type="button">-</button>
          <button class="calc-btn" data-v="7" type="button">7</button>
          <button class="calc-btn" data-v="8" type="button">8</button>
          <button class="calc-btn" data-v="9" type="button">9</button>
          <button class="calc-btn op" data-v="+" type="button">+</button>
          <button class="calc-btn" data-v="4" type="button">4</button>
          <button class="calc-btn" data-v="5" type="button">5</button>
          <button class="calc-btn" data-v="6" type="button">6</button>
          <button class="calc-btn op" data-v="=" type="button">=</button>
          <button class="calc-btn" data-v="1" type="button">1</button>
          <button class="calc-btn" data-v="2" type="button">2</button>
          <button class="calc-btn" data-v="3" type="button">3</button>
          <button class="calc-btn" data-v="0" type="button">0</button>
        </div>
      </div>
    `,
    afterCreate: (win) => setupCalculator(win)
  },
  paint: {
    title: 'Paint',
    icon: '🎨',
    width: 920,
    height: 620,
    minWidth: 700,
    minHeight: 500,
    render: () => `
      <div class="paint-app">
        <div class="paint-topbar">
          <button class="btn" data-paint-action="new" type="button">Создать</button>
          <button class="btn" data-paint-action="undo" type="button">Отменить</button>
          <button class="btn" data-paint-action="redo" type="button">Повторить</button>
          <button class="btn" data-paint-action="clear" type="button">Очистить</button>
          <button class="btn" data-paint-action="save" type="button">Сохранить PNG</button>
          <label class="paint-size-wrap" for="paint-size">Толщина</label>
          <input id="paint-size" class="paint-size" type="range" min="1" max="40" value="3">
          <span class="paint-size-value" data-paint-size-value>3 px</span>
        </div>
        <div class="paint-work">
          <aside class="paint-tools" aria-label="Инструменты Paint">
            <button class="paint-tool active" data-paint-tool="pencil" type="button" title="Карандаш">✏️</button>
            <button class="paint-tool" data-paint-tool="brush" type="button" title="Кисть">🖌️</button>
            <button class="paint-tool" data-paint-tool="eraser" type="button" title="Ластик">🧽</button>
            <button class="paint-tool" data-paint-tool="line" type="button" title="Линия">／</button>
            <button class="paint-tool" data-paint-tool="rectangle" type="button" title="Прямоугольник">▭</button>
            <button class="paint-tool" data-paint-tool="circle" type="button" title="Окружность">◯</button>
            <button class="paint-tool" data-paint-tool="fill" type="button" title="Заливка">🪣</button>
          </aside>
          <div class="paint-sheet" data-paint-sheet>
            <canvas class="paint-canvas" data-paint-canvas></canvas>
          </div>
        </div>
        <div class="paint-palette" data-paint-palette></div>
      </div>
    `,
    afterCreate: (win) => setupPaint(win)
  },
  'control-panel': {
    title: 'Панель управления',
    icon: '⚙️',
    width: 620,
    height: 460,
    render: () => '<div class="empty">Панель управления (заглушка)</div>'
  },
  'internet-explorer': {
    title: 'Internet Explorer',
    icon: '🌐',
    width: 860,
    height: 560,
    render: () => `
      <div class="ie-top">
        <label for="ie-address">Адрес:</label>
        <input id="ie-address" class="ie-input" type="text" value="https://example.com">
        <button class="btn" data-ie="go" type="button">Перейти</button>
        <button class="btn" data-ie="tab" type="button">Открыть во вкладке</button>
      </div>
      <div class="ie-status">Готово</div>
      <iframe class="ie-frame" title="Браузер" referrerpolicy="no-referrer"></iframe>
    `,
    afterCreate: (win) => setupIE(win)
  }
};

function getEntriesByLocation(location) {
  return state.entries.filter((entry) => entry.location === location);
}

function getEntry(id) {
  return state.entries.find((entry) => entry.id === id) || null;
}

function addEntry(type, location) {
  const id = state.nextId;
  state.nextId += 1;
  const name = type === 'folder' ? `Новая папка ${id}` : `Новый файл ${id}.txt`;
  const entry = { id, type, name, content: '', location, previousLocation: null };
  state.entries.push(entry);
  return entry;
}

function moveToRecycle(entryId) {
  const entry = getEntry(entryId);
  if (!entry || entry.location === 'recycle') {
    return;
  }
  entry.previousLocation = entry.location;
  entry.location = 'recycle';
  closeEntryWindows(entryId);
  rerenderDynamicViews();
}

function restoreFromRecycle(entryId) {
  const entry = getEntry(entryId);
  if (!entry || entry.location !== 'recycle') {
    return;
  }
  entry.location = entry.previousLocation || 'documents';
  entry.previousLocation = null;
  rerenderDynamicViews();
}

function deletePermanently(entryId) {
  state.entries = state.entries.filter((entry) => entry.id !== entryId);
  closeEntryWindows(entryId);
  delete state.desktopPositions[`usr-${entryId}`];
  rerenderDynamicViews();
}

function clearRecycleBin() {
  const recycleIds = getEntriesByLocation('recycle').map((entry) => entry.id);
  recycleIds.forEach((id) => closeEntryWindows(id));
  state.entries = state.entries.filter((entry) => entry.location !== 'recycle');
  rerenderDynamicViews();
}

function closeEntryWindows(entryId) {
  const fileWin = state.openWindows.get(`file:${entryId}`);
  if (fileWin) {
    closeWindow(fileWin);
  }
  const folderWin = state.openWindows.get(`folder:${entryId}`);
  if (folderWin) {
    closeWindow(folderWin);
  }
}

function desktopItems() {
  const user = getEntriesByLocation('desktop').map((entry) => ({
    id: `usr-${entry.id}`,
    name: entry.name,
    icon: entry.type === 'folder' ? '📁' : '📄',
    type: entry.type,
    entryId: entry.id
  }));
  return [...systemDesktopItems, ...user];
}

function getDesktopItemById(itemId) {
  return desktopItems().find((item) => item.id === itemId) || null;
}

function ensureDesktopPositions() {
  const items = desktopItems();
  const rect = desktopArea.getBoundingClientRect();
  const rowHeight = 100;
  const colWidth = 96;
  const rows = Math.max(1, Math.floor((rect.height - 16) / rowHeight));

  items.forEach((item, index) => {
    if (!state.desktopPositions[item.id]) {
      const col = Math.floor(index / rows);
      const row = index % rows;
      state.desktopPositions[item.id] = { x: col * colWidth, y: row * rowHeight };
    }
  });
}

function renderDesktop() {
  ensureDesktopPositions();
  desktopIcons.innerHTML = '';
  desktopItems().forEach((item) => {
    const el = document.createElement('button');
    el.className = 'desktop-icon';
    el.type = 'button';
    el.dataset.id = item.id;
    el.innerHTML = `<span class="glyph">${item.icon}</span><span class="label">${item.name}</span>`;
    const pos = state.desktopPositions[item.id];
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    if (state.selectedDesktopIds.has(item.id)) {
      el.classList.add('selected');
    }
    desktopIcons.appendChild(el);
  });
}

function clearDesktopSelection() {
  state.selectedDesktopIds.clear();
  renderDesktop();
}

function selectSingleDesktop(itemId) {
  state.selectedDesktopIds.clear();
  if (itemId) {
    state.selectedDesktopIds.add(itemId);
  }
  renderDesktop();
}

function hideDesktopMenu() {
  desktopMenu.classList.add('hidden');
  state.contextTargetId = null;
}

function showDesktopMenu(x, y, targetId = null) {
  state.contextTargetId = targetId;
  if (targetId) {
    selectSingleDesktop(targetId);
  }
  desktopMenu.classList.remove('hidden');
  const desktopRect = desktop.getBoundingClientRect();
  const menuRect = desktopMenu.getBoundingClientRect();
  const left = Math.min(x, desktopRect.width - menuRect.width - 6);
  const top = Math.min(y, desktopRect.height - menuRect.height - 46);
  desktopMenu.style.left = `${Math.max(6, left)}px`;
  desktopMenu.style.top = `${Math.max(6, top)}px`;
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  clock.textContent = `${hh}:${mm}`;
}

function closeStartMenu() {
  startMenu.classList.add('hidden');
  startBtn.classList.remove('active');
  startBtn.setAttribute('aria-expanded', 'false');
}

function openApp(appId) {
  const app = apps[appId];
  if (!app) {
    return;
  }
  createWindow({ key: `app:${appId}`, ...app });
}

function openEntry(entryId) {
  const entry = getEntry(entryId);
  if (!entry) {
    return;
  }
  if (entry.type === 'folder') {
    createWindow({
      key: `folder:${entry.id}`,
      title: entry.name,
      icon: '📁',
      width: 560,
      height: 390,
      render: () => '<div class="empty">Папка пуста</div>'
    });
    return;
  }
  createWindow({
    key: `file:${entry.id}`,
    title: entry.name,
    icon: '📝',
    width: 650,
    height: 500,
    render: () => `
      <div class="toolbar">Файл | Правка | Формат | Справка</div>
      <textarea class="textarea" spellcheck="false"></textarea>
    `,
    afterCreate: (win) => {
      const editor = win.element.querySelector('.textarea');
      editor.value = entry.content || '';
      editor.addEventListener('input', () => {
        entry.content = editor.value;
      });
    }
  });
}

function openDesktopItem(itemId) {
  const item = getDesktopItemById(itemId);
  if (!item) {
    return;
  }
  if (item.type === 'system') {
    openApp(item.appId);
    return;
  }
  openEntry(item.entryId);
}

function windowRect(pref) {
  const layerRect = windowsLayer.getBoundingClientRect();
  const count = state.openWindows.size;
  const width = Math.min(pref.width || 580, Math.max(300, layerRect.width - 30));
  const height = Math.min(pref.height || 420, Math.max(220, layerRect.height - 30));
  const left = Math.max(8, Math.min(layerRect.width - width - 8, 24 + count * 20));
  const top = Math.max(8, Math.min(layerRect.height - height - 8, 20 + count * 20));
  return { left, top, width, height };
}

function createWindow(config) {
  if (state.openWindows.has(config.key)) {
    const existing = state.openWindows.get(config.key);
    if (existing.minimized) {
      existing.minimized = false;
      existing.element.classList.remove('hidden');
    }
    focusWindow(existing);
    return existing;
  }

  const rect = windowRect(config);
  const element = document.createElement('article');
  element.className = 'xp-window opening';
  element.dataset.key = config.key;
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;

  element.innerHTML = `
    <header class="titlebar">
      <div class="title"><span>${config.icon}</span><span class="title-text">${config.title}</span></div>
      <div class="controls">
        <button class="ctl" data-w="min" type="button">—</button>
        <button class="ctl" data-w="max" type="button">□</button>
        <button class="ctl close" data-w="close" type="button">×</button>
      </div>
    </header>
    <section class="content">${config.render()}</section>
    <div class="resize"></div>
  `;

  windowsLayer.appendChild(element);
  requestAnimationFrame(() => {
    element.classList.remove('opening');
  });

  const taskBtn = document.createElement('button');
  taskBtn.className = 'task-btn';
  taskBtn.type = 'button';
  taskBtn.innerHTML = `<span>${config.icon}</span><span class="task-label">${config.title}</span>`;
  taskButtons.appendChild(taskBtn);

  const win = {
    key: config.key,
    element,
    taskBtn,
    config,
    minimized: false,
    maximized: false,
    restoreRect: null
  };

  state.openWindows.set(config.key, win);
  bindWindow(win);
  if (typeof config.afterCreate === 'function') {
    config.afterCreate(win);
  }
  focusWindow(win);
  return win;
}

function focusWindow(win) {
  state.openWindows.forEach((item) => {
    item.element.classList.remove('active');
    item.taskBtn.classList.remove('active');
  });
  state.z += 1;
  win.element.style.zIndex = String(state.z);
  win.element.classList.add('active');
  win.taskBtn.classList.add('active');
  if (typeof win.config.onFocus === 'function') {
    win.config.onFocus(win);
  }
}

function closeWindow(win) {
  if (!state.openWindows.has(win.key)) {
    return;
  }
  win.element.classList.add('closing');
  setTimeout(() => win.element.remove(), 140);
  win.taskBtn.remove();
  state.openWindows.delete(win.key);
}

function toggleMaximize(win) {
  const el = win.element;
  if (!win.maximized) {
    win.restoreRect = {
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height
    };
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = '100%';
    el.style.height = '100%';
    win.maximized = true;
  } else {
    if (win.restoreRect) {
      el.style.left = win.restoreRect.left;
      el.style.top = win.restoreRect.top;
      el.style.width = win.restoreRect.width;
      el.style.height = win.restoreRect.height;
    }
    win.maximized = false;
  }
  focusWindow(win);
}

function bindWindow(win) {
  const el = win.element;
  const titlebar = el.querySelector('.titlebar');
  const resizeHandle = el.querySelector('.resize');

  el.addEventListener('mousedown', () => focusWindow(win));

  titlebar.addEventListener('mousedown', (event) => {
    if (win.maximized || event.target.closest('.controls')) {
      return;
    }
    dragWindow(event, win);
  });

  resizeHandle.addEventListener('mousedown', (event) => {
    if (win.maximized) {
      return;
    }
    resizeWindow(event, win);
  });

  el.querySelectorAll('.ctl').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = btn.dataset.w;
      if (action === 'min') {
        win.minimized = true;
        win.element.classList.add('hidden');
        win.taskBtn.classList.remove('active');
      } else if (action === 'max') {
        toggleMaximize(win);
      } else if (action === 'close') {
        closeWindow(win);
      }
    });
  });

  win.taskBtn.addEventListener('click', () => {
    if (win.minimized) {
      win.minimized = false;
      win.element.classList.remove('hidden');
      focusWindow(win);
      return;
    }
    if (win.element.classList.contains('active')) {
      win.minimized = true;
      win.element.classList.add('hidden');
      win.taskBtn.classList.remove('active');
      return;
    }
    focusWindow(win);
  });
}

function dragWindow(event, win) {
  event.preventDefault();
  focusWindow(win);
  const el = win.element;
  const areaRect = windowsLayer.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const left0 = parseFloat(el.style.left) || 0;
  const top0 = parseFloat(el.style.top) || 0;

  function onMove(moveEvent) {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    const left = Math.max(0, Math.min(left0 + dx, areaRect.width - el.offsetWidth));
    const top = Math.max(0, Math.min(top0 + dy, areaRect.height - el.offsetHeight));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function resizeWindow(event, win) {
  event.preventDefault();
  event.stopPropagation();
  focusWindow(win);
  const el = win.element;
  const areaRect = windowsLayer.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const w0 = el.offsetWidth;
  const h0 = el.offsetHeight;
  const minW = win.config.minWidth || 280;
  const minH = win.config.minHeight || 200;
  const maxW = areaRect.right - elRect.left;
  const maxH = areaRect.bottom - elRect.top;

  function onMove(moveEvent) {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    const w = Math.max(minW, Math.min(w0 + dx, maxW));
    const h = Math.max(minH, Math.min(h0 + dy, maxH));
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function setupCalculator(win) {
  const display = win.element.querySelector('.calc-display');
  const buttons = win.element.querySelectorAll('.calc-btn');
  let first = null;
  let op = null;
  let wait = false;

  function calc(a, b, oper) {
    if (oper === '+') return a + b;
    if (oper === '-') return a - b;
    if (oper === '×') return a * b;
    if (oper === '÷') return b === 0 ? 0 : a / b;
    return b;
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.v;
      if (/^\d$/.test(value)) {
        if (display.value === '0' || wait) {
          display.value = value;
          wait = false;
        } else {
          display.value += value;
        }
        return;
      }
      if (value === 'C') {
        display.value = '0';
        first = null;
        op = null;
        wait = false;
        return;
      }
      if (value === '=') {
        if (op && first !== null) {
          const result = calc(first, Number(display.value), op);
          display.value = String(Number.isFinite(result) ? Number(result.toFixed(10)) : 0);
          first = null;
          op = null;
          wait = true;
        }
        return;
      }
      const current = Number(display.value);
      if (first === null) {
        first = current;
      } else if (op && !wait) {
        first = calc(first, current, op);
        display.value = String(Number(first.toFixed(10)));
      }
      op = value;
      wait = true;
    });
  });
}

function setupPaint(win) {
  const root = win.element.querySelector('.paint-app');
  const canvas = root?.querySelector('[data-paint-canvas]');
  const sheet = root?.querySelector('[data-paint-sheet]');
  const palette = root?.querySelector('[data-paint-palette]');
  const sizeRange = root?.querySelector('.paint-size');
  const sizeValue = root?.querySelector('[data-paint-size-value]');

  if (!root || !canvas || !sheet || !palette || !sizeRange || !sizeValue) {
    return;
  }

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return;
  }

  root.tabIndex = 0;

  const toolButtons = Array.from(root.querySelectorAll('[data-paint-tool]'));
  const actionButtons = {
    newFile: root.querySelector('[data-paint-action="new"]'),
    undo: root.querySelector('[data-paint-action="undo"]'),
    redo: root.querySelector('[data-paint-action="redo"]'),
    clear: root.querySelector('[data-paint-action="clear"]'),
    save: root.querySelector('[data-paint-action="save"]')
  };

  const paintState = {
    tool: 'pencil',
    color: '#000000',
    size: Number(sizeRange.value) || 3,
    drawing: false,
    startPoint: null,
    previousPoint: null,
    snapshot: null,
    history: [],
    historyIndex: -1
  };

  const swatches = [
    '#000000', '#808080', '#c0c0c0', '#ffffff', '#800000', '#ff0000', '#808000', '#ffff00',
    '#008000', '#00ff00', '#008080', '#00ffff', '#000080', '#0000ff', '#800080', '#ff00ff',
    '#7f3f00', '#ff7f00', '#7f7f3f', '#a0a000', '#3f7f00', '#00a03f', '#007f7f', '#007fff',
    '#3f3f7f', '#7f3fff', '#7f007f', '#ff007f'
  ];

  function setActiveTool() {
    toolButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.paintTool === paintState.tool);
    });
  }

  function setActiveSwatch() {
    palette.querySelectorAll('.paint-swatch').forEach((button) => {
      button.classList.toggle('active', button.dataset.color === paintState.color);
    });
  }

  function updateHistoryButtons() {
    if (actionButtons.undo) {
      actionButtons.undo.disabled = paintState.historyIndex <= 0;
    }
    if (actionButtons.redo) {
      actionButtons.redo.disabled = paintState.historyIndex >= paintState.history.length - 1;
    }
  }

  function fillWhiteBackground() {
    context.save();
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function pushHistory() {
    const snapshot = canvas.toDataURL('image/png');
    if (paintState.history[paintState.historyIndex] === snapshot) {
      updateHistoryButtons();
      return;
    }
    paintState.history = paintState.history.slice(0, paintState.historyIndex + 1);
    paintState.history.push(snapshot);
    if (paintState.history.length > 30) {
      paintState.history.shift();
    }
    paintState.historyIndex = paintState.history.length - 1;
    updateHistoryButtons();
  }

  function restoreHistory(index) {
    const snapshot = paintState.history[index];
    if (!snapshot) {
      return;
    }
    const image = new Image();
    image.onload = () => {
      fillWhiteBackground();
      context.drawImage(image, 0, 0);
    };
    image.src = snapshot;
  }

  function resizeCanvas() {
    const nextWidth = Math.max(420, Math.floor(sheet.clientWidth) - 2);
    const nextHeight = Math.max(280, Math.floor(sheet.clientHeight) - 2);
    if (canvas.width === nextWidth && canvas.height === nextHeight) {
      return;
    }

    const backupCanvas = document.createElement('canvas');
    backupCanvas.width = canvas.width || nextWidth;
    backupCanvas.height = canvas.height || nextHeight;
    const backupContext = backupCanvas.getContext('2d');
    if (backupContext && canvas.width && canvas.height) {
      backupContext.drawImage(canvas, 0, 0);
    }

    canvas.width = nextWidth;
    canvas.height = nextHeight;
    fillWhiteBackground();

    if (backupContext && (paintState.history.length > 0 || (canvas.width && canvas.height))) {
      context.drawImage(backupCanvas, 0, 0);
    }

    if (paintState.history.length === 0) {
      pushHistory();
    } else {
      paintState.history[paintState.historyIndex] = canvas.toDataURL('image/png');
      updateHistoryButtons();
    }
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width - 1, Math.floor(event.clientX - rect.left))),
      y: Math.max(0, Math.min(canvas.height - 1, Math.floor(event.clientY - rect.top)))
    };
  }

  function setStrokeForTool(tool) {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = 'source-over';

    if (tool === 'eraser') {
      context.strokeStyle = '#ffffff';
      context.lineWidth = Math.max(4, paintState.size * 2);
      return;
    }

    if (tool === 'brush') {
      context.strokeStyle = paintState.color;
      context.lineWidth = Math.max(2, paintState.size * 2);
      return;
    }

    context.strokeStyle = paintState.color;
    context.lineWidth = paintState.size;
  }

  function drawFreehand(fromPoint, toPoint, tool) {
    setStrokeForTool(tool);
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
  }

  function drawShape(currentPoint) {
    if (!paintState.snapshot || !paintState.startPoint) {
      return;
    }

    context.putImageData(paintState.snapshot, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = paintState.color;
    context.lineWidth = paintState.size;

    const startX = paintState.startPoint.x;
    const startY = paintState.startPoint.y;
    const endX = currentPoint.x;
    const endY = currentPoint.y;

    if (paintState.tool === 'line') {
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
      return;
    }

    if (paintState.tool === 'rectangle') {
      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      context.strokeRect(left, top, width, height);
      return;
    }

    if (paintState.tool === 'circle') {
      const radius = Math.hypot(endX - startX, endY - startY);
      context.beginPath();
      context.arc(startX, startY, radius, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function parseHexColor(color) {
    const safeColor = color.replace('#', '').trim();
    const normalized = safeColor.length === 3
      ? safeColor.split('').map((chunk) => `${chunk}${chunk}`).join('')
      : safeColor.padEnd(6, '0').slice(0, 6);

    return {
      red: parseInt(normalized.slice(0, 2), 16),
      green: parseInt(normalized.slice(2, 4), 16),
      blue: parseInt(normalized.slice(4, 6), 16),
      alpha: 255
    };
  }

  function floodFill(startX, startY, fillColor) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const totalWidth = canvas.width;
    const totalHeight = canvas.height;

    const startIndex = (startY * totalWidth + startX) * 4;
    const targetRed = pixels[startIndex];
    const targetGreen = pixels[startIndex + 1];
    const targetBlue = pixels[startIndex + 2];
    const targetAlpha = pixels[startIndex + 3];

    if (
      targetRed === fillColor.red &&
      targetGreen === fillColor.green &&
      targetBlue === fillColor.blue &&
      targetAlpha === fillColor.alpha
    ) {
      return false;
    }

    const stack = [[startX, startY]];

    while (stack.length) {
      const [pixelX, pixelY] = stack.pop();
      if (pixelX < 0 || pixelY < 0 || pixelX >= totalWidth || pixelY >= totalHeight) {
        continue;
      }

      const index = (pixelY * totalWidth + pixelX) * 4;
      const sameColor =
        pixels[index] === targetRed &&
        pixels[index + 1] === targetGreen &&
        pixels[index + 2] === targetBlue &&
        pixels[index + 3] === targetAlpha;

      if (!sameColor) {
        continue;
      }

      pixels[index] = fillColor.red;
      pixels[index + 1] = fillColor.green;
      pixels[index + 2] = fillColor.blue;
      pixels[index + 3] = fillColor.alpha;

      stack.push([pixelX + 1, pixelY]);
      stack.push([pixelX - 1, pixelY]);
      stack.push([pixelX, pixelY + 1]);
      stack.push([pixelX, pixelY - 1]);
    }

    context.putImageData(imageData, 0, 0);
    return true;
  }

  function clearCanvas() {
    fillWhiteBackground();
  }

  function saveCanvas() {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `xp-paint-${Date.now()}.png`;
    link.click();
  }

  function commitDrawing() {
    paintState.drawing = false;
    paintState.startPoint = null;
    paintState.previousPoint = null;
    paintState.snapshot = null;
    pushHistory();
  }

  toolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      paintState.tool = button.dataset.paintTool;
      setActiveTool();
    });
  });

  swatches.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.className = 'paint-swatch';
    swatch.type = 'button';
    swatch.dataset.color = color;
    swatch.style.backgroundColor = color;
    swatch.title = color;
    swatch.addEventListener('click', () => {
      paintState.color = color;
      setActiveSwatch();
    });
    palette.appendChild(swatch);
  });

  sizeRange.addEventListener('input', () => {
    paintState.size = Number(sizeRange.value) || 1;
    sizeValue.textContent = `${paintState.size} px`;
  });

  if (actionButtons.newFile) {
    actionButtons.newFile.addEventListener('click', () => {
      const shouldCreate = window.confirm('Создать новый рисунок? Несохранённые изменения останутся только в истории отмены.');
      if (!shouldCreate) {
        return;
      }
      clearCanvas();
      pushHistory();
    });
  }

  if (actionButtons.clear) {
    actionButtons.clear.addEventListener('click', () => {
      clearCanvas();
      pushHistory();
    });
  }

  if (actionButtons.save) {
    actionButtons.save.addEventListener('click', saveCanvas);
  }

  if (actionButtons.undo) {
    actionButtons.undo.addEventListener('click', () => {
      if (paintState.historyIndex <= 0) {
        return;
      }
      paintState.historyIndex -= 1;
      restoreHistory(paintState.historyIndex);
      updateHistoryButtons();
    });
  }

  if (actionButtons.redo) {
    actionButtons.redo.addEventListener('click', () => {
      if (paintState.historyIndex >= paintState.history.length - 1) {
        return;
      }
      paintState.historyIndex += 1;
      restoreHistory(paintState.historyIndex);
      updateHistoryButtons();
    });
  }

  canvas.addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return;
    }

    root.focus();

    const point = pointFromEvent(event);
    if (paintState.tool === 'fill') {
      const fillApplied = floodFill(point.x, point.y, parseHexColor(paintState.color));
      if (fillApplied) {
        pushHistory();
      }
      return;
    }

    paintState.drawing = true;
    paintState.startPoint = point;
    paintState.previousPoint = point;

    if (paintState.tool === 'line' || paintState.tool === 'rectangle' || paintState.tool === 'circle') {
      paintState.snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
      return;
    }

    drawFreehand(point, point, paintState.tool);
  });

  document.addEventListener('mousemove', (event) => {
    if (!paintState.drawing) {
      return;
    }

    const point = pointFromEvent(event);
    if (paintState.tool === 'line' || paintState.tool === 'rectangle' || paintState.tool === 'circle') {
      drawShape(point);
      return;
    }

    if (paintState.previousPoint) {
      drawFreehand(paintState.previousPoint, point, paintState.tool);
    }
    paintState.previousPoint = point;
  });

  document.addEventListener('mouseup', (event) => {
    if (!paintState.drawing || event.button !== 0) {
      return;
    }

    if (paintState.tool === 'line' || paintState.tool === 'rectangle' || paintState.tool === 'circle') {
      drawShape(pointFromEvent(event));
    }

    commitDrawing();
  });

  root.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      actionButtons.undo?.click();
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      actionButtons.redo?.click();
    }
    if (event.ctrlKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveCanvas();
    }
  });

  const observer = new ResizeObserver(() => {
    resizeCanvas();
  });
  observer.observe(sheet);

  resizeCanvas();
  setActiveTool();
  setActiveSwatch();
  sizeValue.textContent = `${paintState.size} px`;
  updateHistoryButtons();
}

function normalizeUrl(raw) {
  const text = (raw || '').trim();
  if (!text) {
    return 'https://example.com';
  }
  if (/^https?:\/\//i.test(text)) {
    return text;
  }
  return `https://${text}`;
}

function setupIE(win) {
  const input = win.element.querySelector('.ie-input');
  const frame = win.element.querySelector('.ie-frame');
  const status = win.element.querySelector('.ie-status');
  const goBtn = win.element.querySelector('[data-ie="go"]');
  const tabBtn = win.element.querySelector('[data-ie="tab"]');

  function go() {
    const url = normalizeUrl(input.value);
    input.value = url;
    status.textContent = `Загрузка: ${url}`;
    frame.src = url;
  }

  goBtn.addEventListener('click', go);
  tabBtn.addEventListener('click', () => {
    const url = normalizeUrl(input.value);
    window.open(url, '_blank');
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      go();
    }
  });
  frame.addEventListener('load', () => {
    status.textContent = `Открыт: ${input.value}`;
  });
  frame.addEventListener('error', () => {
    status.textContent = 'Не удалось встроить сайт. Нажмите «Открыть во вкладке».';
  });

  go();
}

function renderDocuments(win) {
  const pane = win.element.querySelector('[data-docs-pane]');
  if (!pane) {
    return;
  }
  const entries = getEntriesByLocation('documents');
  pane.innerHTML = `
    <div class="recycle-top">
      <div>
        <button class="btn" data-d="new-folder" type="button">Новая папка</button>
        <button class="btn" data-d="new-file" type="button">Новый файл</button>
        <button class="btn" data-d="rename" type="button">Переименовать</button>
        <button class="btn" data-d="delete" type="button">Удалить</button>
      </div>
      <span class="status">Элементов: ${entries.length}</span>
    </div>
    <div class="icon-grid docs-list">
      ${entries.map((entry) => `<button class="item docs-item" type="button" data-id="${entry.id}"><span class="ico">${entry.type === 'folder' ? '📁' : '📄'}</span><span>${entry.name}</span></button>`).join('')}
    </div>
  `;

  let selected = null;
  const refreshSelected = () => {
    pane.querySelectorAll('.docs-item').forEach((btn) => {
      btn.classList.toggle('selected', Number(btn.dataset.id) === selected);
    });
  };

  pane.querySelectorAll('.docs-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      selected = Number(btn.dataset.id);
      refreshSelected();
    });
    btn.addEventListener('dblclick', () => {
      openEntry(Number(btn.dataset.id));
    });
  });

  pane.querySelectorAll('[data-d]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.d;
      if (action === 'new-folder') {
        addEntry('folder', 'documents');
        rerenderDynamicViews();
        return;
      }
      if (action === 'new-file') {
        addEntry('file', 'documents');
        rerenderDynamicViews();
        return;
      }
      if (!selected) {
        return;
      }
      const entry = getEntry(selected);
      if (!entry) {
        return;
      }
      if (action === 'rename') {
        const next = window.prompt('Новое имя:', entry.name);
        if (next && next.trim()) {
          entry.name = next.trim();
          updateTitlesForEntry(entry.id, entry.name);
          rerenderDynamicViews();
        }
      }
      if (action === 'delete') {
        moveToRecycle(selected);
      }
    });
  });
}

function renderRecycle(win) {
  const pane = win.element.querySelector('[data-bin-pane]');
  if (!pane) {
    return;
  }

  const entries = getEntriesByLocation('recycle');
  pane.innerHTML = `
    <div class="recycle-top">
      <div>
        <button class="btn" data-b="restore" type="button">Восстановить</button>
        <button class="btn" data-b="delete" type="button">Удалить навсегда</button>
        <button class="btn" data-b="clear" type="button">Очистить корзину</button>
      </div>
      <span class="status">Элементов: ${entries.length}</span>
    </div>
    ${entries.length ? `<div class="icon-grid bin-list">${entries.map((entry) => `<button class="item bin-item" type="button" data-id="${entry.id}"><span class="ico">${entry.type === 'folder' ? '📁' : '📄'}</span><span>${entry.name}</span></button>`).join('')}</div>` : '<div class="empty">Корзина пуста</div>'}
  `;

  let selected = null;
  const refreshSelected = () => {
    pane.querySelectorAll('.bin-item').forEach((btn) => {
      btn.classList.toggle('selected', Number(btn.dataset.id) === selected);
    });
  };

  pane.querySelectorAll('.bin-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      selected = Number(btn.dataset.id);
      refreshSelected();
    });
  });

  pane.querySelectorAll('[data-b]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.b;
      if (action === 'clear') {
        clearRecycleBin();
        return;
      }
      if (!selected) {
        return;
      }
      if (action === 'restore') {
        restoreFromRecycle(selected);
      }
      if (action === 'delete') {
        deletePermanently(selected);
      }
    });
  });
}

function updateTitlesForEntry(entryId, newName) {
  const fileWindow = state.openWindows.get(`file:${entryId}`);
  if (fileWindow) {
    fileWindow.element.querySelector('.title-text').textContent = newName;
    fileWindow.taskBtn.querySelector('.task-label').textContent = newName;
  }
  const folderWindow = state.openWindows.get(`folder:${entryId}`);
  if (folderWindow) {
    folderWindow.element.querySelector('.title-text').textContent = newName;
    folderWindow.taskBtn.querySelector('.task-label').textContent = newName;
  }
}

function rerenderDynamicViews() {
  renderDesktop();
  state.openWindows.forEach((win) => {
    if (win.key === 'app:my-documents') {
      renderDocuments(win);
    }
    if (win.key === 'app:recycle-bin') {
      renderRecycle(win);
    }
  });
}

function selectedContextDesktopId() {
  return state.contextTargetId || Array.from(state.selectedDesktopIds)[0] || null;
}

function renameDesktopTarget() {
  const id = selectedContextDesktopId();
  if (!id) {
    return;
  }
  const item = getDesktopItemById(id);
  if (!item || item.type === 'system') {
    return;
  }
  const entry = getEntry(item.entryId);
  if (!entry) {
    return;
  }
  const next = window.prompt('Новое имя:', entry.name);
  if (!next || !next.trim()) {
    return;
  }
  entry.name = next.trim();
  updateTitlesForEntry(entry.id, entry.name);
  rerenderDynamicViews();
}

function deleteDesktopTarget() {
  const id = selectedContextDesktopId();
  if (!id) {
    return;
  }
  const item = getDesktopItemById(id);
  if (!item || item.type === 'system') {
    return;
  }
  moveToRecycle(item.entryId);
  state.selectedDesktopIds.delete(id);
  renderDesktop();
}

function openDesktopTarget() {
  const id = selectedContextDesktopId();
  if (id) {
    openDesktopItem(id);
  }
}

function bindDesktopEvents() {
  desktopIcons.addEventListener('dblclick', (event) => {
    const icon = event.target.closest('.desktop-icon');
    if (!icon) {
      return;
    }
    openDesktopItem(icon.dataset.id);
  });

  desktopIcons.addEventListener('contextmenu', (event) => {
    const icon = event.target.closest('.desktop-icon');
    if (!icon) {
      return;
    }
    event.preventDefault();
    closeStartMenu();
    showDesktopMenu(event.clientX, event.clientY, icon.dataset.id);
  });

  desktop.addEventListener('contextmenu', (event) => {
    const onWindow = event.target.closest('.xp-window');
    const onTaskbar = event.target.closest('.taskbar');
    const onStart = event.target.closest('#start-menu');
    const onIcon = event.target.closest('.desktop-icon');
    if (onWindow || onTaskbar || onStart || onIcon) {
      return;
    }
    event.preventDefault();
    closeStartMenu();
    showDesktopMenu(event.clientX, event.clientY, null);
  });

  desktop.addEventListener('mousedown', (event) => {
    if (event.button !== 0) {
      return;
    }

    const onIcon = event.target.closest('.desktop-icon');
    const onMenu = event.target.closest('#desktop-menu');
    const onWindow = event.target.closest('.xp-window');
    const onStart = event.target.closest('#start-menu');
    const onTaskbar = event.target.closest('.taskbar');

    if (onWindow || onStart || onTaskbar || onMenu) {
      return;
    }

    hideDesktopMenu();
    closeStartMenu();

    if (onIcon) {
      const iconId = onIcon.dataset.id;
      if (!event.ctrlKey && !state.selectedDesktopIds.has(iconId)) {
        state.selectedDesktopIds.clear();
        state.selectedDesktopIds.add(iconId);
        renderDesktop();
      }

      if (event.ctrlKey) {
        if (state.selectedDesktopIds.has(iconId)) {
          state.selectedDesktopIds.delete(iconId);
        } else {
          state.selectedDesktopIds.add(iconId);
        }
        renderDesktop();
      }

      const startX = event.clientX;
      const startY = event.clientY;
      const selectedIds = Array.from(state.selectedDesktopIds);
      const initial = selectedIds.map((id) => ({ id, x: state.desktopPositions[id].x, y: state.desktopPositions[id].y }));

      function move(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        initial.forEach((item) => {
          state.desktopPositions[item.id] = {
            x: Math.max(0, item.x + dx),
            y: Math.max(0, item.y + dy)
          };
        });
        renderDesktop();
      }

      function up() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      }

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      return;
    }

    state.selectedDesktopIds.clear();
    renderDesktop();

    const sx = event.clientX;
    const sy = event.clientY;
    selectionBox.classList.remove('hidden');

    function selectMove(moveEvent) {
      const left = Math.min(sx, moveEvent.clientX);
      const top = Math.min(sy, moveEvent.clientY);
      const width = Math.abs(moveEvent.clientX - sx);
      const height = Math.abs(moveEvent.clientY - sy);
      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;

      const box = { left, top, right: left + width, bottom: top + height };
      state.selectedDesktopIds.clear();
      desktopIcons.querySelectorAll('.desktop-icon').forEach((icon) => {
        const rect = icon.getBoundingClientRect();
        const overlap = !(box.right < rect.left || box.left > rect.right || box.bottom < rect.top || box.top > rect.bottom);
        if (overlap) {
          state.selectedDesktopIds.add(icon.dataset.id);
        }
      });
      renderDesktop();
    }

    function selectUp() {
      selectionBox.classList.add('hidden');
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      document.removeEventListener('mousemove', selectMove);
      document.removeEventListener('mouseup', selectUp);
    }

    document.addEventListener('mousemove', selectMove);
    document.addEventListener('mouseup', selectUp);
  });

  desktop.addEventListener('click', (event) => {
    if (!event.target.closest('#desktop-menu')) {
      hideDesktopMenu();
    }
  });

  desktopMenu.addEventListener('click', (event) => {
    const action = event.target.closest('.context-item')?.dataset.action;
    if (!action) {
      return;
    }

    if (action === 'open') {
      openDesktopTarget();
    }
    if (action === 'rename') {
      renameDesktopTarget();
    }
    if (action === 'delete') {
      deleteDesktopTarget();
    }
    if (action === 'new-folder') {
      const entry = addEntry('folder', 'desktop');
      rerenderDynamicViews();
      selectSingleDesktop(`usr-${entry.id}`);
    }
    if (action === 'new-file') {
      const entry = addEntry('file', 'desktop');
      rerenderDynamicViews();
      selectSingleDesktop(`usr-${entry.id}`);
    }

    hideDesktopMenu();
  });
}

function bindStartEvents() {
  startBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    hideDesktopMenu();
    if (startMenu.classList.contains('hidden')) {
      startMenu.classList.remove('hidden');
      startBtn.classList.add('active');
      startBtn.setAttribute('aria-expanded', 'true');
    } else {
      closeStartMenu();
    }
  });

  startMenu.addEventListener('click', (event) => {
    const appId = event.target.closest('.start-item')?.dataset.open;
    const system = event.target.closest('.start-item')?.dataset.system;
    if (appId) {
      openApp(appId);
      closeStartMenu();
      return;
    }
    if (system === 'shutdown') {
      showShutdownDialog();
      closeStartMenu();
    }
  });

  startShutdown.addEventListener('click', () => {
    showShutdownDialog();
    closeStartMenu();
  });
}

function showShutdownDialog() {
  shutdownModal.classList.remove('hidden');
}

function hideShutdownDialog() {
  shutdownModal.classList.add('hidden');
}

function reboot() {
  hideShutdownDialog();
  closeStartMenu();
  hideDesktopMenu();
  rebootScreen.classList.remove('hidden');

  setTimeout(() => {
    state.openWindows.forEach((win) => {
      win.element.remove();
      win.taskBtn.remove();
    });
    state.openWindows.clear();
    rebootScreen.classList.add('hidden');
    clearDesktopSelection();
  }, 3200);
}

function bindShutdownEvents() {
  shutdownModal.addEventListener('click', (event) => {
    if (event.target === shutdownModal) {
      hideShutdownDialog();
      return;
    }

    const action = event.target.closest('.shutdown-btn')?.dataset.shutdown;
    if (!action) {
      return;
    }

    if (action === 'cancel') {
      hideShutdownDialog();
    }
    if (action === 'standby') {
      hideShutdownDialog();
    }
    if (action === 'restart') {
      reboot();
    }
    if (action === 'poweroff') {
      hideShutdownDialog();
      poweroffScreen.classList.remove('hidden');
    }
  });
}

function bindGlobalEvents() {
  window.addEventListener('resize', () => {
    renderDesktop();
    state.openWindows.forEach((win) => {
      if (win.maximized) {
        win.element.style.left = '0px';
        win.element.style.top = '0px';
        win.element.style.width = '100%';
        win.element.style.height = '100%';
        return;
      }
      const areaRect = windowsLayer.getBoundingClientRect();
      const width = Math.min(win.element.offsetWidth, areaRect.width);
      const height = Math.min(win.element.offsetHeight, areaRect.height);
      const left = Math.min(parseFloat(win.element.style.left) || 0, Math.max(0, areaRect.width - width));
      const top = Math.min(parseFloat(win.element.style.top) || 0, Math.max(0, areaRect.height - height));
      win.element.style.width = `${width}px`;
      win.element.style.height = `${height}px`;
      win.element.style.left = `${left}px`;
      win.element.style.top = `${top}px`;
    });
  });
}

function boot() {
  bindDesktopEvents();
  bindStartEvents();
  bindShutdownEvents();
  bindGlobalEvents();
  updateClock();
  setInterval(updateClock, 1000);
  renderDesktop();
}

boot();
