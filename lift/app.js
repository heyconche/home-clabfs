const tabs = Array.from(document.querySelectorAll('.tab'));
const summaryGrid = document.getElementById('summary-grid');
const routineList = document.getElementById('routine-list');
const todayRoutines = document.getElementById('today-routines');
const activeWorkoutShell = document.getElementById('active-workout-shell');
const recentHistory = document.getElementById('recent-history');
const historyList = document.getElementById('history-list');
const editorExercises = document.getElementById('editor-exercises');
const editorTitle = document.getElementById('editor-title');
const syncStatus = document.getElementById('sync-status');
const activeStatus = document.getElementById('active-status');
const lastSaved = document.getElementById('last-saved');

const defaultState = {
    routines: [
        {
            id: uid(),
            name: 'Upper A',
            focus: 'Peito, costas e ombro',
            notes: 'Foco em cargas consistentes e ultima serie perto da falha.',
            exercises: [
                exerciseTemplate('Supino reto', 4, 8, 32),
                exerciseTemplate('Remada curvada', 4, 10, 28),
                exerciseTemplate('Desenvolvimento halteres', 3, 10, 18),
                exerciseTemplate('Rosca direta', 3, 12, 14),
            ],
        },
        {
            id: uid(),
            name: 'Lower A',
            focus: 'Quadriceps, posterior e gluteo',
            notes: 'Descanse 90-120s nos compostos.',
            exercises: [
                exerciseTemplate('Agachamento livre', 4, 6, 70),
                exerciseTemplate('Leg press', 4, 10, 180),
                exerciseTemplate('Stiff', 3, 10, 60),
                exerciseTemplate('Panturrilha em pe', 4, 12, 40),
            ],
        },
        {
            id: uid(),
            name: 'Pull + Arms',
            focus: 'Costas e bracos',
            notes: 'Boa opcao para um treino mais curto.',
            exercises: [
                exerciseTemplate('Puxada alta', 4, 10, 55),
                exerciseTemplate('Remada baixa', 4, 10, 50),
                exerciseTemplate('Face pull', 3, 15, 22),
                exerciseTemplate('Triceps corda', 3, 12, 25),
            ],
        },
    ],
    logs: [],
    activeWorkout: null,
};

let state = clone(defaultState);
let editorState = buildEditor();
let saveErrorShown = false;

bootstrap();

function exerciseTemplate(name, sets, reps, weight) {
    return {
        id: uid(),
        name,
        notes: '',
        sets: Array.from({ length: sets }, (_, index) => ({
            id: uid(),
            weight,
            reps,
            done: index === 0 ? false : false,
        })),
    };
}

function buildEditor(routine = null) {
    if (routine) {
        return {
            id: routine.id,
            name: routine.name,
            focus: routine.focus || '',
            notes: routine.notes || '',
            exercises: routine.exercises.map((exercise) => ({
                id: exercise.id,
                name: exercise.name,
                sets: exercise.sets.length || 3,
                reps: exercise.sets[0]?.reps || 10,
                weight: exercise.sets[0]?.weight || 0,
            })),
        };
    }

    return {
        id: null,
        name: '',
        focus: '',
        notes: '',
        exercises: [
            { id: uid(), name: 'Supino reto', sets: 4, reps: 8, weight: 32 },
            { id: uid(), name: 'Remada curvada', sets: 4, reps: 10, weight: 28 },
        ],
    };
}

async function bootstrap() {
    bindEvents();
    maybeRegisterServiceWorker();
    updateInstallMessage();
    await loadState();
    render();
}

function bindEvents() {
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.getElementById('quick-start-btn').addEventListener('click', quickStartWorkout);
    document.getElementById('add-exercise-btn').addEventListener('click', () => {
        editorState.exercises.push({ id: uid(), name: '', sets: 3, reps: 10, weight: 0 });
        renderEditor();
    });
    document.getElementById('save-routine-btn').addEventListener('click', saveRoutineFromEditor);
    document.getElementById('clear-editor-btn').addEventListener('click', () => {
        editorState = buildEditor();
        renderEditor();
    });

    document.getElementById('routine-name').addEventListener('input', (event) => {
        editorState.name = event.target.value;
    });
    document.getElementById('routine-focus').addEventListener('input', (event) => {
        editorState.focus = event.target.value;
    });
    document.getElementById('routine-notes').addEventListener('input', (event) => {
        editorState.notes = event.target.value;
    });
}

function switchTab(id) {
    document.querySelectorAll('.section').forEach((section) => {
        section.classList.toggle('active', section.id === id);
    });
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === id);
    });
}

async function loadState() {
    try {
        const response = await fetch('/api/lift/state', { credentials: 'include' });
        if (!response.ok) throw new Error('api unavailable');
        const remoteState = mergeState(await response.json());
        state = remoteState;
        stampSaved('sincronizado com servidor');
    } catch (error) {
        state = mergeState(defaultState);
        syncStatus.textContent = 'erro ao carregar do servidor';
        lastSaved.textContent = 'sem dados do servidor';
        window.alert('Nao foi possivel carregar seus dados de treino do servidor. Verifique a sessao e tente recarregar a pagina.');
    }
}

function mergeState(incoming) {
    return {
        routines: Array.isArray(incoming?.routines) ? incoming.routines : clone(defaultState.routines),
        logs: Array.isArray(incoming?.logs) ? incoming.logs : [],
        activeWorkout: incoming?.activeWorkout || null,
    };
}

function render() {
    renderSummary();
    renderToday();
    renderRoutineList();
    renderEditor();
    renderHistory();
    renderActiveStatus();
}

function renderSummary() {
    const workoutsThisMonth = state.logs.filter((log) => {
        const date = new Date(log.startedAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const streak = computeStreak();
    const weeklyVolume = state.logs
        .filter((log) => Date.now() - new Date(log.startedAt).getTime() <= 7 * 24 * 60 * 60 * 1000)
        .reduce((total, log) => total + calcWorkoutVolume(log), 0);
    const nextRoutine = state.routines[0]?.name || 'Monte sua primeira rotina';

    const cards = [
        ['Sequencia', `${streak} dias`, streak ? 'Treinei em dias consecutivos com base no historico.' : 'Comece um treino hoje para subir a sequencia.'],
        ['Mes atual', `${workoutsThisMonth} treinos`, 'Quantidade de sessoes registradas neste mes.'],
        ['Volume 7 dias', `${weeklyVolume.toFixed(0)} kg`, 'Soma simples de carga x repeticoes das ultimas sessoes.'],
        ['Proxima rotina', nextRoutine, 'A primeira rotina da lista vira seu atalho rapido.'],
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
    renderActiveWorkout();
    todayRoutines.innerHTML = state.routines.map((routine) => `
        <div class="routine-card">
            <header>
                <div>
                    <div class="title">${escapeHtml(routine.name)}</div>
                    <div class="muted">${escapeHtml(routine.focus || 'Sem foco definido')}</div>
                </div>
                <button class="action-btn" type="button" data-start-routine="${routine.id}">iniciar</button>
            </header>
            <div class="routine-lines">
                ${routine.exercises.slice(0, 3).map((exercise) => `
                    <div class="routine-line">
                        <span>${escapeHtml(exercise.name)}</span>
                        <span>${exercise.sets.length} x ${exercise.sets[0]?.reps || 0}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('') || '<div class="empty">Crie uma rotina para iniciar um treino em um toque.</div>';

    todayRoutines.querySelectorAll('[data-start-routine]').forEach((button) => {
        button.addEventListener('click', () => startWorkout(button.dataset.startRoutine));
    });

    const recent = [...state.logs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 3);
    recentHistory.innerHTML = recent.map((log) => `
        <div class="history-card">
            <header>
                <div>
                    <div class="title">${escapeHtml(log.routineName)}</div>
                    <div class="muted">${formatDate(log.startedAt)} · ${log.durationMin} min</div>
                </div>
                <span class="active-badge">${calcWorkoutVolume(log).toFixed(0)} kg</span>
            </header>
            <div class="history-lines">
                ${log.exercises.slice(0, 3).map((exercise) => `
                    <div class="history-line">
                        <span>${escapeHtml(exercise.name)}</span>
                        <span>${exercise.sets.filter((set) => set.done).length} series</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('') || '<div class="empty">Seu historico vai aparecer aqui depois do primeiro treino salvo.</div>';
}

function renderActiveWorkout() {
    const workout = state.activeWorkout;
    if (!workout) {
        activeWorkoutShell.innerHTML = `
            <div class="empty">
                <div class="title">Nenhum treino em andamento</div>
                <p style="margin-top:0.45rem;">Escolha uma rotina ao lado ou use o botao "iniciar treino".</p>
            </div>
        `;
        return;
    }

    activeWorkoutShell.innerHTML = `
        <div class="workout-head">
            <div>
                <div class="label">Treino ativo</div>
                <h2 style="margin-top:0.3rem;">${escapeHtml(workout.routineName)}</h2>
                <div class="muted" style="margin-top:0.2rem;">Iniciado ${formatRelative(workout.startedAt)}</div>
            </div>
            <div class="inline-actions">
                <button class="save-btn" id="finish-workout-btn" type="button">finalizar</button>
                <button class="danger-btn" id="discard-workout-btn" type="button">descartar</button>
            </div>
        </div>
        <div class="note-box">
            <div class="label">Notas do treino</div>
            <textarea id="active-workout-notes" placeholder="Como foi o treino? dor, ajuste de carga, tecnica...">${escapeHtml(workout.notes || '')}</textarea>
        </div>
        <div class="stack">
            ${workout.exercises.map((exercise, exerciseIndex) => `
                <div class="exercise-card">
                    <div class="exercise-head">
                        <div>
                            <div class="title">${escapeHtml(exercise.name)}</div>
                            <div class="muted">${exercise.sets.length} series planejadas</div>
                        </div>
                        <button class="chip-btn" type="button" data-add-set="${exerciseIndex}">+ serie</button>
                    </div>
                    <table class="set-table">
                        <thead>
                            <tr>
                                <th>Serie</th>
                                <th>Carga (kg)</th>
                                <th>Reps</th>
                                <th>Feito</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exercise.sets.map((set, setIndex) => `
                                <tr>
                                    <td data-label="Serie">#${setIndex + 1}</td>
                                    <td data-label="Carga"><input type="number" step="0.5" min="0" value="${set.weight}" data-set-field="weight" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}"></td>
                                    <td data-label="Reps"><input type="number" step="1" min="0" value="${set.reps}" data-set-field="reps" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}"></td>
                                    <td data-label="Feito"><button class="done-btn ${set.done ? 'done' : ''}" type="button" data-toggle-set="${exerciseIndex}:${setIndex}">${set.done ? 'feito' : 'pendente'}</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('finish-workout-btn').addEventListener('click', finishWorkout);
    document.getElementById('discard-workout-btn').addEventListener('click', discardWorkout);
    document.getElementById('active-workout-notes').addEventListener('input', (event) => {
        state.activeWorkout.notes = event.target.value;
        queueSave();
    });

    activeWorkoutShell.querySelectorAll('[data-add-set]').forEach((button) => {
        button.addEventListener('click', () => addSet(Number(button.dataset.addSet)));
    });

    activeWorkoutShell.querySelectorAll('[data-toggle-set]').forEach((button) => {
        button.addEventListener('click', () => {
            const [exerciseIndex, setIndex] = button.dataset.toggleSet.split(':').map(Number);
            toggleSetDone(exerciseIndex, setIndex);
        });
    });

    activeWorkoutShell.querySelectorAll('[data-set-field]').forEach((input) => {
        input.addEventListener('input', (event) => {
            const { setField, exerciseIndex, setIndex } = event.target.dataset;
            updateSetField(Number(exerciseIndex), Number(setIndex), setField, event.target.value);
        });
    });
}

function renderRoutineList() {
    routineList.innerHTML = state.routines.map((routine) => `
        <div class="routine-card">
            <header>
                <div>
                    <div class="title">${escapeHtml(routine.name)}</div>
                    <div class="muted">${escapeHtml(routine.focus || 'Sem foco definido')}</div>
                </div>
                <div class="inline-actions">
                    <button class="mini-btn" type="button" data-edit-routine="${routine.id}">editar</button>
                    <button class="action-btn" type="button" data-start-routine="${routine.id}">iniciar</button>
                    <button class="danger-btn" type="button" data-delete-routine="${routine.id}">apagar</button>
                </div>
            </header>
            <div class="routine-lines">
                ${routine.exercises.map((exercise) => `
                    <div class="routine-line">
                        <span>${escapeHtml(exercise.name)}</span>
                        <span>${exercise.sets.length} x ${exercise.sets[0]?.reps || 0} · ${exercise.sets[0]?.weight || 0} kg</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    routineList.querySelectorAll('[data-edit-routine]').forEach((button) => {
        button.addEventListener('click', () => {
            const routine = state.routines.find((item) => item.id === button.dataset.editRoutine);
            if (!routine) return;
            editorState = buildEditor(routine);
            renderEditor();
            switchTab('routines');
        });
    });

    routineList.querySelectorAll('[data-delete-routine]').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!window.confirm('Apagar esta rotina?')) return;
            state.routines = state.routines.filter((item) => item.id !== button.dataset.deleteRoutine);
            await saveState();
            render();
        });
    });

    routineList.querySelectorAll('[data-start-routine]').forEach((button) => {
        button.addEventListener('click', () => startWorkout(button.dataset.startRoutine));
    });
}

function renderEditor() {
    editorTitle.textContent = editorState.id ? 'Editar rotina' : 'Nova rotina';
    document.getElementById('routine-name').value = editorState.name;
    document.getElementById('routine-focus').value = editorState.focus;
    document.getElementById('routine-notes').value = editorState.notes;

    editorExercises.innerHTML = editorState.exercises.map((exercise, index) => `
        <div class="editor-row">
            <input value="${escapeHtml(exercise.name)}" placeholder="Exercicio" data-editor-field="name" data-editor-index="${index}">
            <input type="number" min="1" value="${exercise.sets}" placeholder="Series" data-editor-field="sets" data-editor-index="${index}">
            <input type="number" min="1" value="${exercise.reps}" placeholder="Reps" data-editor-field="reps" data-editor-index="${index}">
            <input type="number" min="0" step="0.5" value="${exercise.weight}" placeholder="Carga" data-editor-field="weight" data-editor-index="${index}">
            <button class="danger-btn" type="button" data-remove-exercise="${index}">x</button>
        </div>
    `).join('');

    editorExercises.querySelectorAll('[data-editor-field]').forEach((input) => {
        input.addEventListener('input', (event) => {
            const exercise = editorState.exercises[Number(event.target.dataset.editorIndex)];
            if (!exercise) return;
            const field = event.target.dataset.editorField;
            exercise[field] = field === 'name' ? event.target.value : Number(event.target.value);
        });
    });

    editorExercises.querySelectorAll('[data-remove-exercise]').forEach((button) => {
        button.addEventListener('click', () => {
            editorState.exercises.splice(Number(button.dataset.removeExercise), 1);
            renderEditor();
        });
    });
}

function renderHistory() {
    const logs = [...state.logs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    historyList.innerHTML = logs.map((log) => `
        <div class="history-card">
            <header>
                <div>
                    <div class="title">${escapeHtml(log.routineName)}</div>
                    <div class="muted">${formatDate(log.startedAt)} · ${log.durationMin} min</div>
                </div>
                <span class="active-badge">${calcWorkoutVolume(log).toFixed(0)} kg</span>
            </header>
            <div class="history-lines">
                ${log.exercises.map((exercise) => `
                    <div class="history-line">
                        <span>${escapeHtml(exercise.name)}</span>
                        <span>${exercise.sets.filter((set) => set.done).length} series feitas</span>
                    </div>
                `).join('')}
            </div>
            ${log.notes ? `<div class="install-tip" style="margin-top:0.8rem;">${escapeHtml(log.notes)}</div>` : ''}
        </div>
    `).join('') || '<div class="empty">Nenhum treino salvo ainda.</div>';
}

function renderActiveStatus() {
    if (!state.activeWorkout) {
        activeStatus.textContent = 'nenhum treino ativo';
        return;
    }
    const totalDone = state.activeWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.done).length, 0);
    activeStatus.textContent = `${state.activeWorkout.routineName}: ${totalDone} series feitas`;
}

async function quickStartWorkout() {
    const routine = state.routines[0];
    if (!routine) {
        switchTab('routines');
        window.alert('Crie uma rotina primeiro.');
        return;
    }
    await startWorkout(routine.id);
}

async function startWorkout(routineId) {
    const routine = state.routines.find((item) => item.id === routineId);
    if (!routine) return;

    if (state.activeWorkout && !window.confirm('Ja existe um treino ativo. Substituir pelo novo?')) {
        return;
    }

    state.activeWorkout = {
        id: uid(),
        routineId: routine.id,
        routineName: routine.name,
        startedAt: new Date().toISOString(),
        notes: '',
        exercises: routine.exercises.map((exercise) => ({
            id: uid(),
            name: exercise.name,
            sets: exercise.sets.map((set) => ({
                id: uid(),
                weight: Number(set.weight) || 0,
                reps: Number(set.reps) || 0,
                done: false,
            })),
        })),
    };
    await saveState();
    switchTab('today');
    render();
}

function updateSetField(exerciseIndex, setIndex, field, value) {
    const set = state.activeWorkout?.exercises?.[exerciseIndex]?.sets?.[setIndex];
    if (!set) return;
    set[field] = Number(value);
    queueSave();
}

function toggleSetDone(exerciseIndex, setIndex) {
    const set = state.activeWorkout?.exercises?.[exerciseIndex]?.sets?.[setIndex];
    if (!set) return;
    set.done = !set.done;
    queueSave().then(render);
}

function addSet(exerciseIndex) {
    const exercise = state.activeWorkout?.exercises?.[exerciseIndex];
    if (!exercise) return;
    const lastSet = exercise.sets[exercise.sets.length - 1] || { weight: 0, reps: 0 };
    exercise.sets.push({
        id: uid(),
        weight: Number(lastSet.weight) || 0,
        reps: Number(lastSet.reps) || 0,
        done: false,
    });
    queueSave().then(render);
}

async function finishWorkout() {
    const workout = state.activeWorkout;
    if (!workout) return;

    const completedSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.done).length, 0);
    if (!completedSets && !window.confirm('Nenhuma serie foi marcada como feita. Salvar mesmo assim?')) {
        return;
    }

    const endedAt = new Date().toISOString();
    state.logs.unshift({
        ...clone(workout),
        endedAt,
        durationMin: Math.max(1, Math.round((new Date(endedAt) - new Date(workout.startedAt)) / 60000)),
    });
    state.activeWorkout = null;
    await saveState();
    render();
    switchTab('history');
}

async function discardWorkout() {
    if (!window.confirm('Descartar o treino atual?')) return;
    state.activeWorkout = null;
    await saveState();
    render();
}

async function saveRoutineFromEditor() {
    const cleanExercises = editorState.exercises
        .filter((exercise) => exercise.name && Number(exercise.sets) > 0 && Number(exercise.reps) > 0)
        .map((exercise) => exerciseTemplate(exercise.name, Number(exercise.sets), Number(exercise.reps), Number(exercise.weight) || 0));

    if (!editorState.name.trim()) {
        window.alert('Defina um nome para a rotina.');
        return;
    }
    if (!cleanExercises.length) {
        window.alert('Adicione pelo menos um exercicio valido.');
        return;
    }

    const routine = {
        id: editorState.id || uid(),
        name: editorState.name.trim(),
        focus: editorState.focus.trim(),
        notes: editorState.notes.trim(),
        exercises: cleanExercises,
    };

    const existingIndex = state.routines.findIndex((item) => item.id === routine.id);
    if (existingIndex >= 0) {
        state.routines.splice(existingIndex, 1, routine);
    } else {
        state.routines.unshift(routine);
    }

    editorState = buildEditor();
    await saveState();
    render();
}

function calcWorkoutVolume(workout) {
    return workout.exercises.reduce((sum, exercise) => {
        return sum + exercise.sets.reduce((exerciseTotal, set) => {
            if (!set.done) return exerciseTotal;
            return exerciseTotal + (Number(set.weight) || 0) * (Number(set.reps) || 0);
        }, 0);
    }, 0);
}

function computeStreak() {
    const uniqueDays = [...new Set(state.logs.map((log) => log.startedAt.slice(0, 10)))].sort().reverse();
    if (!uniqueDays.length) return 0;

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const day of uniqueDays) {
        const expected = cursor.toISOString().slice(0, 10);
        if (day === expected) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
            continue;
        }

        if (streak === 0) {
            cursor.setDate(cursor.getDate() - 1);
            if (day === cursor.toISOString().slice(0, 10)) {
                streak += 1;
                cursor.setDate(cursor.getDate() - 1);
                continue;
            }
        }
        break;
    }
    return streak;
}

async function saveState() {
    try {
        const response = await fetch('/api/lift/state', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state),
        });
        if (!response.ok) throw new Error('save failed');
        saveErrorShown = false;
        stampSaved('sincronizado agora');
    } catch (error) {
        syncStatus.textContent = 'erro ao salvar no servidor';
        lastSaved.textContent = 'alteracoes nao sincronizadas';
        if (!saveErrorShown) {
            saveErrorShown = true;
            window.alert('Nao foi possivel salvar no servidor. As alteracoes desta sessao nao devem ser consideradas persistidas.');
        }
        throw error;
    }
}

let saveTimer = null;
function queueSave() {
    clearTimeout(saveTimer);
    return new Promise((resolve) => {
        saveTimer = setTimeout(async () => {
            try {
                await saveState();
            } catch (error) {
                // Keep the UI state in memory, but do not pretend it persisted.
            }
            resolve();
        }, 250);
    });
}

function stampSaved(status) {
    syncStatus.textContent = status;
    const now = new Date().toISOString();
    lastSaved.textContent = `ultima sincronizacao ${formatTime(now)}`;
}

function maybeRegisterServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
}

function updateInstallMessage() {
    const ua = navigator.userAgent || '';
    const installStatus = document.getElementById('install-status');
    const tip = document.getElementById('install-tip');
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    if (isIOS) {
        installStatus.textContent = 'iPhone: Compartilhar > Tela de Inicio';
        tip.hidden = false;
        return;
    }
    installStatus.textContent = 'Tambem funciona como app instalavel no desktop';
    tip.hidden = true;
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRelative(value) {
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
