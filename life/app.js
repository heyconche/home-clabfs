const tabs = Array.from(document.querySelectorAll('.tab'));
const summaryGrid = document.getElementById('summary-grid');
const syncStatus = document.getElementById('sync-status');
const heroSync = document.getElementById('hero-sync');
const heroNotify = document.getElementById('hero-notify');
const todayHeadline = document.getElementById('today-headline');
const todayTimeline = document.getElementById('today-timeline');
const todayFloating = document.getElementById('today-floating');
const nextUpCard = document.getElementById('next-up-card');
const weekGrid = document.getElementById('week-grid');
const weekMobileList = document.getElementById('week-mobile-list');
const weekRange = document.getElementById('week-range');
const weekCount = document.getElementById('week-count');
const inboxList = document.getElementById('inbox-list');
const inboxSearch = document.getElementById('inbox-search');
const inboxCategoryFilter = document.getElementById('inbox-category-filter');
const inboxStatusFilter = document.getElementById('inbox-status-filter');
const plannerTitle = document.getElementById('planner-title');
const weeklyList = document.getElementById('weekly-list');
const datedList = document.getElementById('dated-list');
const streakGrid = document.getElementById('streak-grid');
const progressSummary = document.getElementById('progress-summary');
const categoryProgress = document.getElementById('category-progress');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
const quickAddBtn = document.getElementById('quick-add-btn');
const saveTaskBtn = document.getElementById('save-task-btn');
const resetTaskBtn = document.getElementById('reset-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const taskNotifyToggle = document.getElementById('task-notify-toggle');
const taskTodayToggle = document.getElementById('task-today-toggle');

const fields = {
    title: document.getElementById('task-title'),
    categoryId: document.getElementById('task-category'),
    mode: document.getElementById('task-mode'),
    dayOfWeek: document.getElementById('task-day'),
    date: document.getElementById('task-date'),
    start: document.getElementById('task-start'),
    end: document.getElementById('task-end'),
    tag: document.getElementById('task-tag'),
    notifyLead: document.getElementById('task-notify-lead'),
    notes: document.getElementById('task-notes'),
};

const fieldDay = document.getElementById('field-day');
const fieldDate = document.getElementById('field-date');
const fieldStart = document.getElementById('field-start');
const fieldEnd = document.getElementById('field-end');

const dayLabels = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
const shortDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const categorySeed = [
    { id: 'health', name: 'Saude', color: '#d9480f' },
    { id: 'meal', name: 'Refeicoes', color: '#8dbb6a' },
    { id: 'pet', name: 'Joaquim', color: '#9a7b0b' },
    { id: 'prep', name: 'Preparacao', color: '#4ea3de' },
    { id: 'work', name: 'Trabalho', color: '#6d5ab7' },
    { id: 'home', name: 'Casa', color: '#c996b2' },
    { id: 'study', name: 'Estudo', color: '#134e5e' },
    { id: 'admin', name: 'Admin', color: '#475569' },
];

const defaultState = {
    categories: categorySeed,
    tasks: buildScheduleSeed(),
    completions: {},
    notificationLog: {},
    settings: { weekStartHour: 6, weekEndHour: 23 },
};

let state = structuredClone(defaultState);
let activeTab = 'today';
let saveTimer = null;
let swRegistration = null;
let editorState = buildEditor();

bootstrap();

function buildScheduleSeed() {
    const weekly = [];
    const add = (dayOfWeek, title, categoryId, start, end, extras = {}) => {
        weekly.push(makeTask({ title, categoryId, mode: 'weekly', dayOfWeek, start, end, ...extras }));
    };

    add(0, 'Academia', 'health', '10:00', '11:30', { notify: true });
    add(0, 'Cafe da manha', 'meal', '11:30', '12:00');
    add(0, 'Passear com Joaquim', 'pet', '12:00', '12:30');
    add(0, 'Tomar banho e se arrumar', 'prep', '12:30', '13:00');
    add(0, 'Passear com Joaquim', 'pet', '18:30', '19:30');
    add(0, 'Jantar', 'meal', '19:30', '20:30');

    add(1, 'Academia', 'health', '06:30', '07:30', { notify: true });
    add(1, 'Cafe da manha', 'meal', '07:30', '08:00');
    add(1, 'Passear com Joaquim', 'pet', '08:00', '08:30');
    add(1, 'Tomar banho e se arrumar', 'prep', '08:30', '09:00');
    add(1, 'Home Office', 'work', '09:00', '12:00', { tag: 'foco' });
    add(1, 'Horario de almoco', 'meal', '12:00', '14:00');
    add(1, 'Home Office', 'work', '14:00', '18:00');
    add(1, 'Arrumar a casa', 'home', '18:00', '18:30');
    add(1, 'Passear com Joaquim', 'pet', '18:30', '19:30');
    add(1, 'Jantar', 'meal', '19:30', '20:30');
    add(1, 'Estudar', 'study', '20:30', '21:30', { notify: true, notifyLead: 15 });

    add(2, 'Tomar banho e se arrumar', 'prep', '06:30', '07:30');
    add(2, 'Passear com Joaquim', 'pet', '07:30', '08:00');
    add(2, 'Cafe da manha', 'meal', '08:00', '08:30');
    add(2, 'Ir ao trabalho', 'work', '08:30', '09:00');
    add(2, 'Presencial', 'work', '09:00', '12:00');
    add(2, 'Horario de almoco', 'meal', '12:00', '14:00');
    add(2, 'Presencial', 'work', '14:00', '17:30');
    add(2, 'Voltar do trabalho', 'work', '17:30', '18:30');
    add(2, 'Passear com Joaquim', 'pet', '18:30', '19:30');
    add(2, 'Jantar', 'meal', '19:30', '20:30');

    add(3, 'Academia', 'health', '06:30', '07:30', { notify: true });
    add(3, 'Cafe da manha', 'meal', '07:30', '08:00');
    add(3, 'Passear com Joaquim', 'pet', '08:00', '08:30');
    add(3, 'Tomar banho e se arrumar', 'prep', '08:30', '09:00');
    add(3, 'Home Office', 'work', '09:00', '12:00');
    add(3, 'Horario de almoco', 'meal', '12:00', '14:00');
    add(3, 'Home Office', 'work', '14:00', '18:00');
    add(3, 'Arrumar a casa', 'home', '18:00', '18:30');
    add(3, 'Passear com Joaquim', 'pet', '18:30', '19:30');
    add(3, 'Jantar', 'meal', '19:30', '20:30');
    add(3, 'Estudar', 'study', '20:30', '21:30', { notify: true, notifyLead: 15 });

    add(4, 'Academia', 'health', '06:30', '07:30', { notify: true });
    add(4, 'Cafe da manha', 'meal', '07:30', '08:00');
    add(4, 'Passear com Joaquim', 'pet', '08:00', '08:30');
    add(4, 'Tomar banho e se arrumar', 'prep', '08:30', '09:00');
    add(4, 'Home Office', 'work', '09:00', '12:00');
    add(4, 'Horario de almoco', 'meal', '12:00', '14:00');
    add(4, 'Home Office', 'work', '14:00', '18:00');
    add(4, 'Estudar', 'study', '18:00', '19:00', { notify: true, notifyLead: 15 });
    add(4, 'Passear com Joaquim', 'pet', '19:00', '19:30');
    add(4, 'Jantar', 'meal', '19:30', '20:30');

    add(5, 'Academia', 'health', '06:30', '07:30', { notify: true });
    add(5, 'Cafe da manha', 'meal', '07:30', '08:00');
    add(5, 'Passear com Joaquim', 'pet', '08:00', '08:30');
    add(5, 'Tomar banho e se arrumar', 'prep', '08:30', '09:00');
    add(5, 'Home Office', 'work', '09:00', '12:00');
    add(5, 'Horario de almoco', 'meal', '12:00', '14:00');
    add(5, 'Home Office', 'work', '14:00', '17:00');
    add(5, 'Arrumar a casa', 'home', '17:00', '18:00');
    add(5, 'Estudar', 'study', '18:00', '19:00', { notify: true, notifyLead: 15 });
    add(5, 'Passear com Joaquim', 'pet', '19:00', '19:30');
    add(5, 'Jantar', 'meal', '19:30', '20:30');

    add(6, 'Academia', 'health', '08:30', '09:30');
    add(6, 'Cafe da manha', 'meal', '09:30', '10:00');
    add(6, 'Passear com Joaquim', 'pet', '10:00', '10:30');
    add(6, 'Tomar banho e se arrumar', 'prep', '10:30', '11:00');
    add(6, 'Almoco', 'meal', '12:30', '13:00');
    add(6, 'Lanche da tarde', 'meal', '16:00', '16:30');
    add(6, 'Jantar', 'meal', '19:30', '20:30');

    return weekly;
}

function buildEditor(task = null) {
    if (!task) {
        return {
            id: null,
            title: '',
            categoryId: state.categories?.[0]?.id || 'admin',
            mode: 'weekly',
            dayOfWeek: String(new Date().getDay()),
            date: todayKey(),
            start: '',
            end: '',
            tag: '',
            notes: '',
            notify: false,
            notifyLead: 10,
            pinToToday: false,
        };
    }

    return {
        id: task.id,
        title: task.title,
        categoryId: task.categoryId,
        mode: task.mode,
        dayOfWeek: task.dayOfWeek != null ? String(task.dayOfWeek) : String(new Date().getDay()),
        date: task.date || todayKey(),
        start: task.start || '',
        end: task.end || '',
        tag: task.tag || '',
        notes: task.notes || '',
        notify: Boolean(task.notify),
        notifyLead: Number(task.notifyLead || 10),
        pinToToday: false,
    };
}

function makeTask(partial) {
    return {
        id: partial.id || uid(),
        title: partial.title || '',
        categoryId: partial.categoryId || 'admin',
        mode: partial.mode || 'inbox',
        dayOfWeek: partial.dayOfWeek ?? null,
        date: partial.date || '',
        start: partial.start || '',
        end: partial.end || '',
        tag: partial.tag || '',
        notes: partial.notes || '',
        notify: Boolean(partial.notify),
        notifyLead: Number(partial.notifyLead || 10),
        completedAt: partial.completedAt || '',
        createdAt: partial.createdAt || new Date().toISOString(),
    };
}

async function bootstrap() {
    populateStaticFields();
    bindEvents();
    await registerNotifications();
    await loadState();
    editorState = buildEditor();
    render();
    startReminderLoop();
}

function populateStaticFields() {
    fields.dayOfWeek.innerHTML = dayLabels.map((day, index) => `<option value="${index}">${day}</option>`).join('');
}

function bindEvents() {
    document.addEventListener('click', handleDelegatedClick);

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    inboxSearch.addEventListener('input', renderInbox);
    inboxCategoryFilter.addEventListener('change', renderInbox);
    inboxStatusFilter.addEventListener('change', renderInbox);
    fields.mode.addEventListener('change', () => {
        editorState.mode = fields.mode.value;
        updateModeFields();
    });

    Object.entries(fields).forEach(([key, input]) => {
        input.addEventListener('input', () => {
            editorState[key] = input.value;
            if (key === 'notifyLead') {
                renderEditorControls();
            }
        });
        input.addEventListener('change', () => {
            editorState[key] = input.value;
            if (key === 'notifyLead') {
                renderEditorControls();
            }
        });
    });

    taskNotifyToggle.addEventListener('click', () => {
        editorState.notify = !editorState.notify;
        renderEditorControls();
    });

    taskTodayToggle.addEventListener('click', () => {
        editorState.pinToToday = !editorState.pinToToday;
        renderEditorControls();
    });

    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    quickAddBtn.addEventListener('click', () => {
        switchTab('planner');
        resetEditor('weekly');
        fields.title.focus();
    });
    saveTaskBtn.addEventListener('click', saveTaskFromEditor);
    resetTaskBtn.addEventListener('click', () => resetEditor(fields.mode.value));
    deleteTaskBtn.addEventListener('click', deleteCurrentTask);
}

function handleDelegatedClick(event) {
    const doneButton = event.target.closest('[data-toggle-done]');
    if (doneButton) {
        toggleDone(doneButton.dataset.toggleDone, todayKey());
        return;
    }

    const editButton = event.target.closest('[data-edit-task]');
    if (editButton) {
        editTask(editButton.dataset.editTask);
        return;
    }

    const notifyButton = event.target.closest('[data-toggle-notify]');
    if (notifyButton) {
        quickToggleNotify(notifyButton.dataset.toggleNotify);
        return;
    }

    const promoteButton = event.target.closest('[data-promote-today]');
    if (promoteButton) {
        promoteInboxToToday(promoteButton.dataset.promoteToday);
        return;
    }

    const removeButton = event.target.closest('[data-remove-task]');
    if (removeButton) {
        removeTask(removeButton.dataset.removeTask);
    }
}

async function registerNotifications() {
    if (!('serviceWorker' in navigator)) {
        updatePermissionPills();
        return;
    }
    try {
        swRegistration = await navigator.serviceWorker.register('/sw.js?v=1');
    } catch (error) {
        swRegistration = null;
    }
    updatePermissionPills();
}

function updatePermissionPills() {
    const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
    const map = {
        granted: 'avisos ativos',
        denied: 'avisos bloqueados',
        default: 'avisos desativados',
        unsupported: 'sem suporte a aviso',
    };
    heroNotify.textContent = map[permission] || 'avisos desativados';
    enableNotificationsBtn.textContent = permission === 'granted' ? 'avisos permitidos' : 'ativar avisos';
}

async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') {
        window.alert('Esse navegador nao oferece suporte a notificacoes web.');
        return;
    }
    const result = await Notification.requestPermission();
    updatePermissionPills();
    if (result === 'granted') {
        await sendNotification('Avisos do Life ligados', 'Agora voce pode ativar lembretes em atividades individuais.');
    }
}

async function loadState() {
    try {
        const response = await fetch('/api/life/state', { credentials: 'include' });
        if (!response.ok) throw new Error('load failed');
        const payload = await response.json();
        state = mergeState(payload);
        stampSaved();
    } catch (error) {
        state = mergeState(defaultState);
        syncStatus.textContent = 'sem dados do servidor';
        heroSync.textContent = 'carregado do padrao';
        window.alert('Nao foi possivel carregar sua rotina do servidor. Vou abrir com uma estrutura inicial baseada no seu quadro atual.');
    }
}

function mergeState(payload) {
    return {
        categories: Array.isArray(payload?.categories) && payload.categories.length ? payload.categories : structuredClone(categorySeed),
        tasks: Array.isArray(payload?.tasks) ? payload.tasks.map((task) => makeTask(task)) : structuredClone(defaultState.tasks),
        completions: payload?.completions && typeof payload.completions === 'object' ? payload.completions : {},
        notificationLog: payload?.notificationLog && typeof payload.notificationLog === 'object' ? payload.notificationLog : {},
        settings: payload?.settings || structuredClone(defaultState.settings),
    };
}

function switchTab(id) {
    activeTab = id;
    document.querySelectorAll('.section').forEach((section) => {
        section.classList.toggle('active', section.id === id);
    });
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === id);
    });
}

function render() {
    syncCategoryFilter();
    renderSummary();
    renderToday();
    renderWeek();
    renderInbox();
    renderPlanner();
    renderProgress();
    updateModeFields();
    renderEditorControls();
}

function syncCategoryFilter() {
    const options = ['<option value="all">todas</option>'].concat(
        state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    );
    const currentFilter = inboxCategoryFilter.value || 'all';
    inboxCategoryFilter.innerHTML = options.join('');
    inboxCategoryFilter.value = currentFilter;

    const categoryOptions = state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join('');
    const selectedCategory = editorState.categoryId || state.categories[0]?.id;
    fields.categoryId.innerHTML = categoryOptions;
    fields.categoryId.value = selectedCategory;
}

function renderSummary() {
    const todayTasks = getTasksForDate(todayKey()).filter((task) => task.start && task.end);
    const doneToday = todayTasks.filter((task) => isTaskDoneForTask(task, todayKey())).length;
    const inboxOpen = state.tasks.filter((task) => task.mode === 'inbox' && !isTaskDoneForTask(task, todayKey())).length;
    const notifyCount = state.tasks.filter((task) => task.notify).length;
    const minutes = todayTasks.reduce((total, task) => total + durationMinutes(task.start, task.end), 0);
    const cards = [
        ['Hoje', `${doneToday}/${todayTasks.length || 0}`, doneToday ? 'Blocos concluidos na agenda de hoje.' : 'Marque os blocos conforme for andando com o dia.'],
        ['Carga do dia', `${Math.round(minutes / 60 * 10) / 10}h`, 'Soma simples do tempo planejado em blocos para hoje.'],
        ['Backlog', `${inboxOpen} abertas`, 'Demandas sem horario ou data esperando encaixe.'],
        ['Avisos', `${notifyCount} ativos`, 'Atividades com lembrete opt-in ligado.'],
    ];

    summaryGrid.innerHTML = cards.map(([label, value, note]) => `
        <div class="card">
            <div class="label">${label}</div>
            <div class="metric-value">${value}</div>
            <div class="metric-note">${note}</div>
        </div>
    `).join('');
}

function renderToday() {
    const key = todayKey();
    const scheduled = getTasksForDate(key).filter((task) => task.start && task.end).sort(sortByTime);
    const floating = state.tasks.filter((task) => task.mode === 'inbox').sort(sortByCreated);
    const nextTask = scheduled.find((task) => !isTaskDoneForTask(task, key) && upcomingOrNow(key, task));
    const now = new Date();

    todayHeadline.textContent = scheduled.length
        ? `Hoje voce tem ${scheduled.length} blocos planejados. Agora sao ${timeLabel(now)} e o foco e manter o dia leve, visivel e executavel.`
        : 'Sem blocos cravados para hoje ainda. Pode puxar algo do backlog ou usar o editor para montar o dia.';

    todayTimeline.innerHTML = scheduled.length ? scheduled.map((task) => renderTimelineItem(task, key)).join('') : '<div class="empty">Nenhuma atividade com horario para hoje ainda.</div>';
    todayFloating.innerHTML = floating.length ? floating.slice(0, 5).map((task) => renderInboxTask(task, true)).join('') : '<div class="empty">Seu backlog esta limpo por enquanto.</div>';
    nextUpCard.innerHTML = nextTask ? renderNextTask(nextTask, key) : '<div class="empty">Nada urgente na fila. Se quiser, puxe uma atividade sem horario para hoje.</div>';

    bindTodayActions();
}

function renderTimelineItem(task, key) {
    const category = getCategory(task.categoryId);
    const done = isTaskDoneForTask(task, key);
    return `
        <div class="timeline-item ${done ? 'done' : ''}" data-task-card="${task.id}">
            <div class="timeline-head">
                <div>
                    <div class="label">${escapeHtml(category.name)}</div>
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="subtitle">${formatTimeRange(task.start, task.end)}${task.tag ? ` · ${escapeHtml(task.tag)}` : ''}</div>
                </div>
                <div class="inline-actions">
                    <button class="toggle-btn ${done ? 'is-done' : ''}" type="button" data-toggle-done="${task.id}">${done ? 'feito' : 'concluir'}</button>
                    <button class="toggle-btn ${task.notify ? 'is-on' : ''}" type="button" data-toggle-notify="${task.id}">${task.notify ? 'aviso on' : 'aviso off'}</button>
                    <button class="ghost-btn" type="button" data-edit-task="${task.id}">editar</button>
                </div>
            </div>
            <div class="timeline-meta">
                <span class="chip" style="border-color:${alpha(category.color, 0.42)}; color:${lightText(category.color)}; background:${alpha(category.color, 0.14)}">${durationMinutes(task.start, task.end)} min</span>
                <span class="chip ${task.notify ? 'is-on' : ''}">${task.notify ? `${task.notifyLead} min antes` : 'sem lembrete'}</span>
                ${task.notes ? `<span class="chip">${escapeHtml(task.notes.slice(0, 48))}${task.notes.length > 48 ? '...' : ''}</span>` : ''}
            </div>
        </div>
    `;
}

function renderNextTask(task, key) {
    const category = getCategory(task.categoryId);
    const done = isTaskDoneForTask(task, key);
    return `
        <div class="task-card ${done ? 'done' : ''}">
            <div class="task-head">
                <div>
                    <div class="label">${escapeHtml(category.name)}</div>
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="subtitle">${formatTimeRange(task.start, task.end)}</div>
                </div>
                <span class="chip" style="border-color:${alpha(category.color, 0.42)}; color:${lightText(category.color)}; background:${alpha(category.color, 0.14)}">${task.tag || 'proximo bloco'}</span>
            </div>
            <div class="timeline-meta">
                <button class="toggle-btn ${done ? 'is-done' : ''}" type="button" data-toggle-done="${task.id}">${done ? 'feito' : 'marcar feito'}</button>
                <button class="ghost-btn" type="button" data-edit-task="${task.id}">ajustar</button>
            </div>
        </div>
    `;
}

function bindTodayActions() {
    return;
}

function renderWeek() {
    const start = startOfCurrentWeek();
    const weekDates = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    weekRange.textContent = `${formatShortDate(weekDates[0])} - ${formatShortDate(weekDates[6])}`;
    const weekBlocks = weekDates.flatMap((date) => getTasksForDate(date).filter((task) => task.start && task.end));
    weekCount.textContent = `${weekBlocks.length} blocos`;

    const startHour = state.settings.weekStartHour;
    const endHour = state.settings.weekEndHour;
    const totalHours = endHour - startHour;
    const hourHeight = 72;
    const laneHeight = totalHours * hourHeight;
    weekGrid.style.setProperty('--hour-height', `${hourHeight}px`);

    const header = ['<div class="week-time-header"><span class="label">Horario</span></div>']
        .concat(weekDates.map((date, index) => `
            <div class="week-day-header">
                <strong>${dayLabels[index]}</strong>
                <span>${formatShortDate(date)}</span>
            </div>
        `)).join('');

    const timeLabels = [];
    for (let hour = startHour; hour <= endHour; hour += 1) {
        const top = (hour - startHour) * hourHeight;
        timeLabels.push(`<div class="time-label" style="top:${top}px">${String(hour).padStart(2, '0')}:00</div>`);
    }

    const columns = weekDates.map((date) => {
        const dayIndex = weekdayIndex(date);
        const items = getTasksForDate(date)
            .filter((task) => task.start && task.end)
            .sort(sortByTime)
            .map((task) => renderWeekBlock(task, date, startHour, hourHeight))
            .join('');
        return `<div class="week-column"><div class="week-lane" style="height:${laneHeight}px">${items}</div></div>`;
    }).join('');

    weekGrid.innerHTML = `${header}<div class="week-times" style="height:${laneHeight}px">${timeLabels.join('')}</div>${columns}`;

    weekMobileList.innerHTML = weekDates.map((date) => renderMobileWeekDay(date)).join('');
}

function renderWeekBlock(task, dateKeyValue, startHour, hourHeight) {
    const category = getCategory(task.categoryId);
    const top = minutesFromStart(task.start, startHour) * (hourHeight / 60);
    const height = Math.max(42, durationMinutes(task.start, task.end) * (hourHeight / 60));
    const done = isTaskDoneForTask(task, dateKeyValue);
    return `
                    <button class="week-block" type="button" data-edit-task="${task.id}" style="top:${top}px; height:${height}px; background:${category.color}; opacity:${done ? 0.62 : 1}">
            <small>${formatTimeRange(task.start, task.end)}</small>
            <strong>${escapeHtml(task.title)}</strong>
        </button>
    `;
}

function renderMobileWeekDay(dateKeyValue) {
    const items = getTasksForDate(dateKeyValue).filter((task) => task.start && task.end).sort(sortByTime);
    return `
        <div class="week-mobile-day">
            <div class="week-mobile-head">
                <div>
                    <div class="label">${dayLabels[weekdayIndex(dateKeyValue)]}</div>
                    <div class="title">${formatLongDate(dateKeyValue)}</div>
                </div>
                <span class="chip">${items.length} blocos</span>
            </div>
            <div class="task-stack" style="margin-top:1rem;">
                ${items.length ? items.map((task) => `
                    <div class="task-card">
                        <div class="task-head">
                            <div>
                                <div class="title">${escapeHtml(task.title)}</div>
                                <div class="subtitle">${formatTimeRange(task.start, task.end)}</div>
                            </div>
                            <button class="ghost-btn" type="button" data-edit-task="${task.id}">editar</button>
                        </div>
                    </div>
                `).join('') : '<div class="empty">Nada planejado para esse dia.</div>'}
            </div>
        </div>
    `;
}

function renderInbox() {
    const search = inboxSearch.value.trim().toLowerCase();
    const categoryFilter = inboxCategoryFilter.value || 'all';
    const statusFilter = inboxStatusFilter.value || 'open';

    const items = state.tasks
        .filter((task) => task.mode === 'inbox')
        .filter((task) => categoryFilter === 'all' || task.categoryId === categoryFilter)
        .filter((task) => {
            const done = isTaskDoneForTask(task, todayKey());
            if (statusFilter === 'open') return !done;
            if (statusFilter === 'done') return done;
            return true;
        })
        .filter((task) => !search || `${task.title} ${task.notes} ${task.tag}`.toLowerCase().includes(search))
        .sort((a, b) => Number(isTaskDoneForTask(a, todayKey())) - Number(isTaskDoneForTask(b, todayKey())) || sortByCreated(a, b));

    inboxList.innerHTML = items.length ? items.map((task) => renderInboxTask(task)).join('') : '<div class="empty">Nada encontrado com esses filtros.</div>';
    bindTodayActions();
}

function renderInboxTask(task, compact = false) {
    const category = getCategory(task.categoryId);
    const done = isTaskDoneForTask(task, todayKey());
    return `
        <div class="inbox-item ${done ? 'done' : ''}">
            <div class="inbox-head">
                <div>
                    <div class="label">${escapeHtml(category.name)}</div>
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="subtitle">${task.tag ? escapeHtml(task.tag) : 'sem horario definido'}${task.notes ? ` · ${escapeHtml(task.notes.slice(0, compact ? 36 : 90))}${task.notes.length > (compact ? 36 : 90) ? '...' : ''}` : ''}</div>
                </div>
                <div class="inline-actions">
                    <button class="toggle-btn ${done ? 'is-done' : ''}" type="button" data-toggle-done="${task.id}">${done ? 'feito' : 'check'}</button>
                    <button class="ghost-btn" type="button" data-promote-today="${task.id}">hoje</button>
                    <button class="ghost-btn" type="button" data-edit-task="${task.id}">editar</button>
                </div>
            </div>
        </div>
    `;
}

function renderPlanner() {
    plannerTitle.textContent = editorState.id ? 'Editar atividade' : 'Nova atividade';
    deleteTaskBtn.hidden = !editorState.id;

    fields.title.value = editorState.title;
    fields.categoryId.value = editorState.categoryId;
    fields.mode.value = editorState.mode;
    fields.dayOfWeek.value = editorState.dayOfWeek;
    fields.date.value = editorState.date;
    fields.start.value = editorState.start;
    fields.end.value = editorState.end;
    fields.tag.value = editorState.tag;
    fields.notifyLead.value = String(editorState.notifyLead);
    fields.notes.value = editorState.notes;

    const weekly = state.tasks.filter((task) => task.mode === 'weekly').sort((a, b) => a.dayOfWeek - b.dayOfWeek || sortByTime(a, b));
    const dated = state.tasks.filter((task) => task.mode === 'dated').sort((a, b) => a.date.localeCompare(b.date) || sortByTime(a, b));

    weeklyList.innerHTML = weekly.length ? weekly.map((task) => renderPlannerCard(task)).join('') : '<div class="empty">Nenhum bloco semanal cadastrado.</div>';
    datedList.innerHTML = dated.length ? dated.map((task) => renderPlannerCard(task)).join('') : '<div class="empty">Nenhuma atividade com data definida ainda.</div>';

}

function renderPlannerCard(task) {
    const category = getCategory(task.categoryId);
    const timing = task.mode === 'weekly'
        ? `${dayLabels[task.dayOfWeek]}${task.start && task.end ? ` · ${formatTimeRange(task.start, task.end)}` : ''}`
        : `${task.date ? formatLongDate(task.date) : 'sem data'}${task.start && task.end ? ` · ${formatTimeRange(task.start, task.end)}` : ''}`;
    return `
        <div class="task-card">
            <div class="task-head">
                <div>
                    <div class="label">${escapeHtml(category.name)}</div>
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="subtitle">${timing}</div>
                </div>
                <div class="inline-actions">
                    <button class="toggle-btn ${task.notify ? 'is-on' : ''}" type="button" data-toggle-notify="${task.id}">${task.notify ? 'aviso on' : 'aviso off'}</button>
                    <button class="ghost-btn" type="button" data-edit-task="${task.id}">editar</button>
                    <button class="danger-btn" type="button" data-remove-task="${task.id}">x</button>
                </div>
            </div>
            <div class="card-meta">
                ${task.tag ? `<span class="chip">${escapeHtml(task.tag)}</span>` : ''}
                ${task.notes ? `<span class="chip">${escapeHtml(task.notes.slice(0, 52))}${task.notes.length > 52 ? '...' : ''}</span>` : ''}
            </div>
        </div>
    `;
}

function renderProgress() {
    const last7 = Array.from({ length: 7 }, (_, offset) => addDays(todayKey(), -6 + offset));
    streakGrid.innerHTML = last7.map((dateKeyValue) => {
        const tasks = getTasksForDate(dateKeyValue).filter((task) => task.start && task.end);
        const done = tasks.filter((task) => isTaskDoneForTask(task, dateKeyValue)).length;
        const ratio = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        return `
            <div class="task-card">
                <div class="task-head">
                    <div>
                        <div class="label">${shortDayLabels[weekdayIndex(dateKeyValue)]}</div>
                        <div class="title">${formatShortDate(dateKeyValue)}</div>
                    </div>
                    <span class="chip">${done}/${tasks.length || 0}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${ratio}%; background:${ratio >= 80 ? '#22c55e' : ratio >= 40 ? '#eab308' : '#7E17B6'}"></div>
                </div>
            </div>
        `;
    }).join('');

    const streak = computeStreak();
    const completion = completionRate(7);
    const weeklyHours = state.tasks
        .filter((task) => task.mode === 'weekly' && task.start && task.end)
        .reduce((total, task) => total + durationMinutes(task.start, task.end), 0) / 60;

    progressSummary.innerHTML = [
        summaryCard('Sequencia', `${streak} dias`, 'Dias seguidos com alguma entrega marcada.'),
        summaryCard('Entrega 7 dias', `${completion}%`, 'Percentual dos blocos concluido na ultima semana.'),
        summaryCard('Carga semanal', `${Math.round(weeklyHours * 10) / 10}h`, 'Tempo semanal previsto so nas rotinas recorrentes.'),
    ].join('');

    const distribution = state.categories.map((category) => {
        const minutes = state.tasks
            .filter((task) => task.categoryId === category.id && task.start && task.end)
            .reduce((total, task) => total + durationMinutes(task.start, task.end), 0);
        return { category, minutes };
    }).filter((item) => item.minutes > 0).sort((a, b) => b.minutes - a.minutes);
    const max = distribution[0]?.minutes || 1;

    categoryProgress.innerHTML = distribution.map((item) => `
        <div class="task-card">
            <div class="task-head">
                <div>
                    <div class="title">${escapeHtml(item.category.name)}</div>
                    <div class="subtitle">${Math.round(item.minutes / 60 * 10) / 10}h por semana</div>
                </div>
                <span class="chip">${Math.round((item.minutes / max) * 100)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${(item.minutes / max) * 100}%; background:${item.category.color}"></div>
            </div>
        </div>
    `).join('') || '<div class="empty">As categorias vao ganhar distribuicao assim que voce tiver blocos com horario.</div>';
}

function summaryCard(label, value, note) {
    return `
        <div class="task-card">
            <div class="label">${label}</div>
            <div class="metric-value" style="font-size:1.7rem;">${value}</div>
            <div class="metric-note">${note}</div>
        </div>
    `;
}

function updateModeFields() {
    const mode = editorState.mode;
    fieldDay.style.display = mode === 'weekly' ? 'grid' : 'none';
    fieldDate.style.display = mode === 'dated' ? 'grid' : 'none';
    const timeVisible = mode !== 'inbox';
    fieldStart.style.display = timeVisible ? 'grid' : 'none';
    fieldEnd.style.display = timeVisible ? 'grid' : 'none';
}

function renderEditorControls() {
    taskNotifyToggle.classList.toggle('is-on', editorState.notify);
    taskNotifyToggle.textContent = editorState.notify ? `aviso ${editorState.notifyLead} min antes` : 'aviso desligado';
    taskTodayToggle.classList.toggle('is-on', editorState.pinToToday);
    taskTodayToggle.textContent = editorState.pinToToday ? 'vai para hoje tambem' : 'puxar para hoje';
}

function saveTaskFromEditor() {
    const title = editorState.title.trim();
    if (!title) {
        window.alert('Dê um nome para a atividade antes de salvar.');
        return;
    }

    if (editorState.mode === 'weekly' && editorState.start && editorState.end && editorState.end <= editorState.start) {
        window.alert('O horario final precisa ser depois do inicio.');
        return;
    }

    if (editorState.mode === 'dated' && !editorState.date) {
        window.alert('Escolha a data para a atividade pontual.');
        return;
    }

    const task = makeTask({
        id: editorState.id || uid(),
        title,
        categoryId: editorState.categoryId,
        mode: editorState.mode,
        dayOfWeek: editorState.mode === 'weekly' ? Number(editorState.dayOfWeek) : null,
        date: editorState.mode === 'dated' ? editorState.date : '',
        start: editorState.mode === 'inbox' ? '' : editorState.start,
        end: editorState.mode === 'inbox' ? '' : editorState.end,
        tag: editorState.tag.trim(),
        notes: editorState.notes.trim(),
        notify: editorState.notify,
        notifyLead: Number(editorState.notifyLead || 10),
        completedAt: editorState.id ? state.tasks.find((item) => item.id === editorState.id)?.completedAt : '',
        createdAt: editorState.id ? state.tasks.find((item) => item.id === editorState.id)?.createdAt : undefined,
    });

    const existingIndex = state.tasks.findIndex((item) => item.id === task.id);
    if (existingIndex >= 0) {
        state.tasks.splice(existingIndex, 1, task);
    } else {
        state.tasks.push(task);
    }

    if (editorState.pinToToday && task.mode !== 'dated') {
        state.tasks.push(makeTask({
            title: task.title,
            categoryId: task.categoryId,
            mode: 'dated',
            date: todayKey(),
            start: task.start,
            end: task.end,
            tag: task.tag,
            notes: task.notes,
            notify: task.notify,
            notifyLead: task.notifyLead,
        }));
    }

    resetEditor(task.mode);
    queueSave();
    render();
    switchTab(task.mode === 'inbox' ? 'inbox' : 'today');
}

function resetEditor(mode = 'weekly') {
    editorState = buildEditor();
    editorState.mode = mode;
    renderPlanner();
    updateModeFields();
    renderEditorControls();
}

function deleteCurrentTask() {
    if (!editorState.id) return;
    removeTask(editorState.id);
    resetEditor('weekly');
}

function removeTask(taskId) {
    state.tasks = state.tasks.filter((task) => task.id !== taskId);
    Object.keys(state.completions).forEach((dateKeyValue) => {
        if (state.completions[dateKeyValue]?.[taskId]) {
            delete state.completions[dateKeyValue][taskId];
        }
    });
    queueSave();
    render();
}

function editTask(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    editorState = buildEditor(task);
    switchTab('planner');
    renderPlanner();
    updateModeFields();
    renderEditorControls();
}

function quickToggleNotify(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.notify = !task.notify;
    queueSave();
    render();
}

function promoteInboxToToday(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    state.tasks.push(makeTask({
        title: task.title,
        categoryId: task.categoryId,
        mode: 'dated',
        date: todayKey(),
        start: '',
        end: '',
        tag: task.tag,
        notes: task.notes,
        notify: false,
    }));
    queueSave();
    switchTab('today');
    render();
}

function toggleDone(taskId, dateKeyValue) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;

    if (task.mode === 'inbox') {
        task.completedAt = task.completedAt ? '' : new Date().toISOString();
        queueSave();
        render();
        return;
    }

    if (!state.completions[dateKeyValue]) {
        state.completions[dateKeyValue] = {};
    }
    state.completions[dateKeyValue][taskId] = !state.completions[dateKeyValue][taskId];
    queueSave();
    render();
}

function isTaskDone(taskId, dateKeyValue) {
    return Boolean(state.completions?.[dateKeyValue]?.[taskId]);
}

function isTaskDoneForTask(task, dateKeyValue) {
    if (!task) return false;
    if (task.mode === 'inbox') {
        return Boolean(task.completedAt);
    }
    return isTaskDone(task.id, dateKeyValue);
}

function getTasksForDate(dateKeyValue) {
    const dayIndex = weekdayIndex(dateKeyValue);
    return state.tasks.filter((task) => {
        if (task.mode === 'weekly') return task.dayOfWeek === dayIndex;
        if (task.mode === 'dated') return task.date === dateKeyValue;
        return false;
    });
}

function getCategory(categoryId) {
    return state.categories.find((category) => category.id === categoryId) || state.categories[0];
}

function startReminderLoop() {
    checkNotifications();
    window.setInterval(checkNotifications, 30000);
}

async function checkNotifications() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const today = todayKey();
    const now = new Date();
    const tasks = getTasksForDate(today).filter((task) => task.notify && task.start && !isTaskDoneForTask(task, today));

    for (const task of tasks) {
        const startsAt = combineDateTime(today, task.start);
        if (!startsAt) continue;
        const reminderAt = new Date(startsAt.getTime() - task.notifyLead * 60000);
        const key = `${today}|${task.id}|${task.start}`;
        if (state.notificationLog[key]) continue;
        if (now >= reminderAt && now < new Date(startsAt.getTime() + 120000)) {
            await sendNotification(task.title, `${task.notifyLead} min para ${task.title} · ${formatTimeRange(task.start, task.end)}`, key);
            state.notificationLog[key] = now.toISOString();
            queueSave();
        }
    }
}

async function sendNotification(title, body, tag = `life-${Date.now()}`) {
    if (swRegistration) {
        await swRegistration.showNotification(title, {
            body,
            tag,
            badge: '/icon.svg',
            icon: '/icon.svg',
        });
        return;
    }
    new Notification(title, { body, tag });
}

function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveState().catch(() => {
            syncStatus.textContent = 'erro ao salvar';
            heroSync.textContent = 'erro ao salvar';
        });
    }, 250);
}

async function saveState() {
    const response = await fetch('/api/life/state', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
    });
    if (!response.ok) {
        throw new Error('save failed');
    }
    stampSaved();
}

function stampSaved() {
    const text = `ultima sincronizacao ${timeLabel(new Date())}`;
    syncStatus.textContent = text;
    heroSync.textContent = 'sincronizado com servidor';
}

function startOfCurrentWeek() {
    const now = new Date();
    return addDays(todayKey(), -now.getDay());
}

function completionRate(days) {
    const dates = Array.from({ length: days }, (_, index) => addDays(todayKey(), -(days - 1) + index));
    let total = 0;
    let done = 0;
    dates.forEach((dateKeyValue) => {
        const tasks = getTasksForDate(dateKeyValue).filter((task) => task.start && task.end);
        total += tasks.length;
        done += tasks.filter((task) => isTaskDoneForTask(task, dateKeyValue)).length;
    });
    return total ? Math.round((done / total) * 100) : 0;
}

function computeStreak() {
    let streak = 0;
    let offset = 0;
    while (true) {
        const dateKeyValue = addDays(todayKey(), -offset);
        const tasks = getTasksForDate(dateKeyValue);
        const doneAny = tasks.some((task) => isTaskDoneForTask(task, dateKeyValue));
        if (!doneAny) break;
        streak += 1;
        offset += 1;
    }
    return streak;
}

function upcomingOrNow(dateKeyValue, task) {
    const startsAt = combineDateTime(dateKeyValue, task.start);
    const endsAt = combineDateTime(dateKeyValue, task.end);
    if (!startsAt || !endsAt) return false;
    const now = new Date();
    return now <= endsAt;
}

function sortByTime(a, b) {
    return `${a.start}`.localeCompare(`${b.start}`) || `${a.end}`.localeCompare(`${b.end}`) || sortByCreated(a, b);
}

function sortByCreated(a, b) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function durationMinutes(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function minutesFromStart(time, startHour) {
    const [hour, minute] = time.split(':').map(Number);
    return ((hour - startHour) * 60) + minute;
}

function combineDateTime(dateKeyValue, time) {
    if (!time) return null;
    return new Date(`${dateKeyValue}T${time}:00`);
}

function weekdayIndex(dateKeyValue) {
    return new Date(`${dateKeyValue}T00:00:00`).getDay();
}

function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function addDays(dateKeyValue, amount) {
    const date = new Date(`${dateKeyValue}T00:00:00`);
    date.setDate(date.getDate() + amount);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatShortDate(dateKeyValue) {
    return new Date(`${dateKeyValue}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatLongDate(dateKeyValue) {
    return new Date(`${dateKeyValue}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

function formatTimeRange(start, end) {
    if (!start && !end) return 'sem horario';
    return `${start || '--:--'} - ${end || '--:--'}`;
}

function timeLabel(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function alpha(hex, opacity) {
    const clean = hex.replace('#', '');
    const expanded = clean.length === 3 ? clean.split('').map((value) => value + value).join('') : clean;
    const bigint = parseInt(expanded, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function lightText(hex) {
    return '#f1f5f9';
}
