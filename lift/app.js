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
const muscleCharts = document.getElementById('muscle-charts');
const measureCharts = document.getElementById('measure-charts');
const measureSummary = document.getElementById('measure-summary');

const defaultState = {
    routines: [
        {
            id: uid(),
            name: 'Upper A',
            focus: 'Peito, costas e ombro',
            notes: 'Foco em cargas consistentes e ultima serie perto da falha.',
            exercises: [
                exerciseTemplate('Supino reto', 4, 8, 32, 'Peitoral'),
                exerciseTemplate('Remada curvada', 4, 10, 28, 'Costas'),
                exerciseTemplate('Desenvolvimento halteres', 3, 10, 18, 'Ombro'),
                exerciseTemplate('Rosca direta', 3, 12, 14, 'Biceps'),
            ],
        },
        {
            id: uid(),
            name: 'Lower A',
            focus: 'Quadriceps, posterior e gluteo',
            notes: 'Descanse 90-120s nos compostos.',
            exercises: [
                exerciseTemplate('Agachamento livre', 4, 6, 70, 'Quadriceps'),
                exerciseTemplate('Leg press', 4, 10, 180, 'Quadriceps'),
                exerciseTemplate('Stiff', 3, 10, 60, 'Posterior'),
                exerciseTemplate('Panturrilha em pe', 4, 12, 40, 'Panturrilha'),
            ],
        },
        {
            id: uid(),
            name: 'Pull + Arms',
            focus: 'Costas e bracos',
            notes: 'Boa opcao para um treino mais curto.',
            exercises: [
                exerciseTemplate('Puxada alta', 4, 10, 55, 'Costas'),
                exerciseTemplate('Remada baixa', 4, 10, 50, 'Costas'),
                exerciseTemplate('Face pull', 3, 15, 22, 'Ombro'),
                exerciseTemplate('Triceps corda', 3, 12, 25, 'Triceps'),
            ],
        },
    ],
    logs: [],
    activeWorkout: null,
    bodyMetrics: [],
};

let state = clone(defaultState);
let editorState = buildEditor();
let saveErrorShown = false;

bootstrap();

function exerciseTemplate(name, sets, reps, weight, muscle = '') {
    return {
        id: uid(),
        name,
        muscle,
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
                muscle: exercise.muscle || '',
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
            { id: uid(), name: 'Supino reto', muscle: 'Peitoral', sets: 4, reps: 8, weight: 32 },
            { id: uid(), name: 'Remada curvada', muscle: 'Costas', sets: 4, reps: 10, weight: 28 },
        ],
    };
}

async function bootstrap() {
    bindEvents();
    await disableOfflineCache();
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
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
    document.getElementById('save-measure-btn').addEventListener('click', saveBodyMetric);
    document.getElementById('clear-measures-btn').addEventListener('click', clearMeasures);

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
        bodyMetrics: Array.isArray(incoming?.bodyMetrics) ? incoming.bodyMetrics : [],
    };
}

function render() {
    renderSummary();
    renderToday();
    renderRoutineList();
    renderEditor();
    renderHistory();
    renderProgress();
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
        <div class="editor-card">
            <div class="editor-hint">Exercicio ${index + 1}</div>
            <div class="editor-row">
                <label class="editor-field">
                    <span>Exercicio</span>
                    <input value="${escapeHtml(exercise.name)}" placeholder="Ex: Supino reto" data-editor-field="name" data-editor-index="${index}">
                </label>
                <label class="editor-field">
                    <span>Series</span>
                    <input type="number" min="1" value="${exercise.sets}" placeholder="4" data-editor-field="sets" data-editor-index="${index}">
                </label>
                <label class="editor-field">
                    <span>Reps</span>
                    <input type="number" min="1" value="${exercise.reps}" placeholder="8" data-editor-field="reps" data-editor-index="${index}">
                </label>
                <label class="editor-field">
                    <span>Carga (kg)</span>
                    <input type="number" min="0" step="0.5" value="${exercise.weight}" placeholder="32" data-editor-field="weight" data-editor-index="${index}">
                </label>
                <label class="editor-field">
                    <span>Musculo</span>
                    <input value="${escapeHtml(exercise.muscle || '')}" placeholder="Ex: Peitoral" data-editor-field="muscle" data-editor-index="${index}">
                </label>
                <button class="danger-btn" type="button" data-remove-exercise="${index}">x</button>
            </div>
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

function renderProgress() {
    renderMuscleCharts();
    renderMeasureSummary();
    renderMeasureCharts();
    seedMeasureForm();
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
            muscle: exercise.muscle || '',
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
    applyRoutineProgression(workout);
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
        .map((exercise) => exerciseTemplate(
            exercise.name,
            Number(exercise.sets),
            Number(exercise.reps),
            Number(exercise.weight) || 0,
            exercise.muscle || ''
        ));

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

async function clearHistory() {
    if (!window.confirm('Limpar todo o historico de treinos salvo no servidor?')) {
        return;
    }
    state.logs = [];
    await saveState();
    render();
}

async function clearMeasures() {
    if (!window.confirm('Limpar todas as medidas corporais salvas no servidor?')) {
        return;
    }
    state.bodyMetrics = [];
    await saveState();
    render();
}

async function saveBodyMetric() {
    const entry = {
        id: uid(),
        date: document.getElementById('measure-date').value || new Date().toISOString().slice(0, 10),
        weight: readMeasureValue('measure-weight'),
        biceps: readMeasureValue('measure-biceps'),
        waist: readMeasureValue('measure-waist'),
        thigh: readMeasureValue('measure-thigh'),
        calf: readMeasureValue('measure-calf'),
        chest: readMeasureValue('measure-chest'),
    };

    state.bodyMetrics = state.bodyMetrics.filter((item) => item.date !== entry.date);
    state.bodyMetrics.unshift(entry);
    state.bodyMetrics.sort((a, b) => new Date(b.date) - new Date(a.date));
    await saveState();
    render();
}

function applyRoutineProgression(workout) {
    const routine = state.routines.find((item) => item.id === workout.routineId);
    if (!routine) return;

    workout.exercises.forEach((loggedExercise) => {
        const completedSets = loggedExercise.sets.filter((set) => set.done);
        if (!completedSets.length) return;

        const bestSet = completedSets.sort(compareSets)[0];
        const routineExercise = routine.exercises.find((item) => item.name === loggedExercise.name);
        if (!routineExercise) return;

        const templateSet = routineExercise.sets[0] || { weight: 0, reps: 0 };
        if (isSetImprovement(bestSet, templateSet)) {
            routineExercise.muscle = loggedExercise.muscle || routineExercise.muscle || '';
            routineExercise.sets = routineExercise.sets.map(() => ({
                id: uid(),
                weight: Number(bestSet.weight) || 0,
                reps: Number(bestSet.reps) || 0,
                done: false,
            }));
        }
    });
}

function compareSets(a, b) {
    const weightDelta = (Number(b?.weight) || 0) - (Number(a?.weight) || 0);
    if (weightDelta !== 0) return weightDelta;
    return (Number(b?.reps) || 0) - (Number(a?.reps) || 0);
}

function isSetImprovement(candidate, current) {
    const candidateWeight = Number(candidate?.weight) || 0;
    const currentWeight = Number(current?.weight) || 0;
    if (candidateWeight > currentWeight) return true;
    if (candidateWeight < currentWeight) return false;
    return (Number(candidate?.reps) || 0) >= (Number(current?.reps) || 0);
}

function renderMuscleCharts() {
    const muscleData = buildMuscleSeries();
    const cards = Object.entries(muscleData).map(([muscle, points]) => {
        const lastPoint = points[points.length - 1];
        return `
            <div class="chart-card">
                <header>
                    <div>
                        <div class="title">${escapeHtml(muscle)}</div>
                        <div class="muted">${points.length} sessoes com volume registrado</div>
                    </div>
                    <span class="active-badge">${lastPoint ? `${Math.round(lastPoint.value)} kg` : '0 kg'}</span>
                </header>
                ${points.length >= 2 ? buildLineChart(points, '#a855f7') : '<div class="chart-empty">Registre pelo menos 2 treinos desse musculo para ver a linha de progresso.</div>'}
            </div>
        `;
    });

    muscleCharts.innerHTML = cards.join('') || '<div class="chart-empty">Conforme voce registrar treinos, o progresso por musculo vai aparecer aqui.</div>';
}

function renderMeasureSummary() {
    const latest = [...state.bodyMetrics].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (!latest) {
        measureSummary.innerHTML = '<div class="chart-empty">Adicione sua primeira medicao para acompanhar evolucao de peso e medidas.</div>';
        return;
    }

    const stats = [
        ['Peso', latest.weight, 'kg'],
        ['Biceps', latest.biceps, 'cm'],
        ['Cintura', latest.waist, 'cm'],
        ['Coxa', latest.thigh, 'cm'],
        ['Panturrilha', latest.calf, 'cm'],
        ['Peitoral', latest.chest, 'cm'],
    ];

    measureSummary.innerHTML = stats.map(([label, value, unit]) => `
        <div class="mini-stat">
            <div class="label">${label}</div>
            <strong>${value ? `${value}${unit}` : '--'}</strong>
            <div class="metric-meta">${formatDate(latest.date)}</div>
        </div>
    `).join('');
}

function renderMeasureCharts() {
    const fields = [
        ['weight', 'Peso corporal', '#22c55e', 'kg'],
        ['biceps', 'Biceps', '#a855f7', 'cm'],
        ['waist', 'Cintura', '#f97316', 'cm'],
        ['thigh', 'Coxa', '#3b82f6', 'cm'],
        ['calf', 'Panturrilha', '#eab308', 'cm'],
        ['chest', 'Peitoral', '#ec4899', 'cm'],
    ];

    const sorted = [...state.bodyMetrics].sort((a, b) => new Date(a.date) - new Date(b.date));
    measureCharts.innerHTML = fields.map(([field, label, color, unit]) => {
        const points = sorted
            .filter((item) => Number(item[field]) > 0)
            .map((item) => ({ label: formatShortDate(item.date), value: Number(item[field]) }));

        return `
            <div class="measure-card">
                <header>
                    <div class="title">${label}</div>
                    <div class="muted">${points.length ? `${points[points.length - 1].value}${unit}` : 'sem dados'}</div>
                </header>
                ${points.length >= 2 ? buildLineChart(points, color) : '<div class="chart-empty">Adicione pelo menos 2 medicoes para visualizar a evolucao.</div>'}
            </div>
        `;
    }).join('');
}

function buildMuscleSeries() {
    const series = {};
    [...state.logs]
        .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
        .forEach((log) => {
            const byMuscle = {};
            log.exercises.forEach((exercise) => {
                const muscle = exercise.muscle || 'Geral';
                const volume = exercise.sets.reduce((sum, set) => {
                    if (!set.done) return sum;
                    return sum + (Number(set.weight) || 0) * (Number(set.reps) || 0);
                }, 0);
                byMuscle[muscle] = (byMuscle[muscle] || 0) + volume;
            });

            Object.entries(byMuscle).forEach(([muscle, value]) => {
                if (!series[muscle]) series[muscle] = [];
                series[muscle].push({ label: formatShortDate(log.startedAt), value });
            });
        });
    return series;
}

function buildLineChart(points, color) {
    const width = 320;
    const height = 180;
    const padding = 20;
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const coords = points.map((point, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
        const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
        return { ...point, x, y };
    });

    const polyline = coords.map((point) => `${point.x},${point.y}`).join(' ');
    const labels = coords.map((point) => `
        <circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}"></circle>
        <text x="${point.x}" y="${height - 4}" text-anchor="middle" font-size="10" fill="#94a3b8">${point.label}</text>
    `).join('');

    return `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="grafico de linha">
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#334155" stroke-width="1"></line>
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#334155" stroke-width="1"></line>
            <polyline fill="none" stroke="${color}" stroke-width="3" points="${polyline}"></polyline>
            ${labels}
        </svg>
    `;
}

function seedMeasureForm() {
    document.getElementById('measure-date').value = new Date().toISOString().slice(0, 10);
}

function readMeasureValue(id) {
    const value = Number(document.getElementById(id).value);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function calcWorkoutVolume(workout) {
    return workout.exercises.reduce((sum, exercise) => {
        return sum + exercise.sets.reduce((exerciseTotal, set) => {
            if (!set.done) return exerciseTotal;
            return exerciseTotal + (Number(set.weight) || 0) * (Number(set.reps) || 0);
        }, 0);
    }, 0);
}

function formatShortDate(value) {
    return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    });
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

async function disableOfflineCache() {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        } catch (error) {
            // Ignore cleanup failures and continue with server-backed mode.
        }
    }

    if ('caches' in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.filter((key) => key.startsWith('lift-')).map((key) => caches.delete(key)));
        } catch (error) {
            // Ignore cache cleanup failures.
        }
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
