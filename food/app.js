const tabs = Array.from(document.querySelectorAll('.tab'));
const summaryGrid = document.getElementById('summary-grid');
const mealStack = document.getElementById('meal-stack');
const foodList = document.getElementById('food-list');
const historyList = document.getElementById('history-list');
const lastSaved = document.getElementById('last-saved');
const currentDateInput = document.getElementById('current-date');
const foodEditorTitle = document.getElementById('food-editor-title');
const marketList = document.getElementById('market-list');
const shoppingList = document.getElementById('shopping-list');

const mealOrder = ['Cafe da manha', 'Almoco', 'Lanche', 'Jantar', 'Ceia'];

const defaultState = {
    goals: { calories: 2400, protein: 190, carbs: 220, fat: 70 },
    foods: [
        makeFood('Frango grelhado', 100, 'g', 31, 0, 3.6),
        makeFood('Arroz cozido', 100, 'g', 2.5, 28, 0.3),
        makeFood('Ovo inteiro', 1, 'un', 6.5, 0.8, 4.5),
        makeFood('Whey protein', 30, 'g', 23, 4, 2),
        makeFood('Aveia', 30, 'g', 5, 18, 3),
        makeFood('Iogurte natural', 170, 'g', 8, 10, 4),
        makeFood('Banana', 1, 'un', 1.3, 23, 0.3),
        makeFood('Batata inglesa cozida', 100, 'g', 1.9, 20, 0.1),
        makeFood('Pao frances', 1, 'un', 4.5, 28, 1.8),
        makeFood('Leite integral', 200, 'ml', 6.2, 9.6, 6),
    ],
    days: {},
    market: [],
};

let state = structuredClone(defaultState);
let activeTab = 'today';
let foodFormState = { id: null };
let marketFormState = { id: null };

bootstrap();

function makeFood(name, servingAmount, servingUnit, protein, carbs, fat) {
    return {
        id: uid(),
        name,
        servingAmount,
        servingUnit,
        protein,
        carbs,
        fat,
    };
}

async function bootstrap() {
    bindEvents();
    await loadState();
    ensureCurrentDay();
    render();
}

function bindEvents() {
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    currentDateInput.addEventListener('change', () => {
        ensureCurrentDay();
        render();
    });

    document.getElementById('clear-day-btn').addEventListener('click', clearCurrentDay);
    document.getElementById('save-goals-btn').addEventListener('click', saveGoals);
    document.getElementById('save-food-btn').addEventListener('click', saveFoodFromForm);
    document.getElementById('clear-food-form-btn').addEventListener('click', resetFoodForm);
    document.getElementById('save-market-btn').addEventListener('click', saveMarketItem);
    document.getElementById('clear-market-form-btn').addEventListener('click', resetMarketForm);
    document.getElementById('market-food-search').addEventListener('input', updateMarketSuggestions);
    document.getElementById('market-food-search').addEventListener('focus', updateMarketSuggestions);
    document.getElementById('market-food-search').addEventListener('blur', () => {
        setTimeout(hideMarketSuggestions, 120);
    });
}

async function loadState() {
    currentDateInput.value = todayKey();
    try {
        const response = await fetch('/api/food/state', { credentials: 'include' });
        if (!response.ok) throw new Error('load failed');
        const payload = await response.json();
        state = mergeState(payload);
        lastSaved.textContent = `ultima sincronizacao ${timeLabel(new Date())}`;
    } catch (error) {
        state = mergeState(defaultState);
        lastSaved.textContent = 'sem dados do servidor';
        window.alert('Nao foi possivel carregar seus dados do servidor. Recarregue a pagina depois de conferir a sessao.');
    }
}

function mergeState(payload) {
    return {
        goals: payload?.goals || structuredClone(defaultState.goals),
        foods: Array.isArray(payload?.foods) && payload.foods.length ? payload.foods : structuredClone(defaultState.foods),
        days: payload?.days && typeof payload.days === 'object' ? payload.days : {},
        market: Array.isArray(payload?.market) ? payload.market : [],
    };
}

function ensureCurrentDay() {
    const key = currentDateInput.value || todayKey();
    currentDateInput.value = key;
    if (!state.days[key]) {
        state.days[key] = {
            meals: mealOrder.map((name) => ({ id: uid(), name, entries: [] })),
        };
    }
}

function render() {
    renderTabs();
    renderSummary();
    renderToday();
    renderFoods();
    renderMarket();
    renderHistory();
}

function renderTabs() {
    document.querySelectorAll('.section').forEach((section) => {
        section.classList.toggle('active', section.id === activeTab);
    });
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === activeTab);
    });
}

function renderSummary() {
    const totals = dayTotals(getCurrentDay());
    const goals = state.goals;
    const cards = [
        metricCard('Calorias', `${totals.calories.toFixed(0)} kcal`, goals.calories, totals.calories, '#7E17B6'),
        metricCard('Proteina', `${totals.protein.toFixed(1)} g`, goals.protein, totals.protein, '#22c55e'),
        metricCard('Carbo', `${totals.carbs.toFixed(1)} g`, goals.carbs, totals.carbs, '#3b82f6'),
        metricCard('Gordura', `${totals.fat.toFixed(1)} g`, goals.fat, totals.fat, '#eab308'),
    ];
    summaryGrid.innerHTML = cards.join('');
}

function metricCard(label, valueLabel, goal, current, color) {
    const pct = goal ? Math.min(100, Math.round(current / goal * 100)) : 0;
    return `
        <div class="card">
            <div class="label">${label}</div>
            <div class="metric-value">${valueLabel}</div>
            <div class="metric-note">meta ${goal || 0} · ${pct}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${pct}%; background:${color};"></div>
            </div>
        </div>
    `;
}

function renderToday() {
    const day = getCurrentDay();
    mealStack.innerHTML = day.meals.map((meal) => mealCard(meal)).join('');
    attachMealEvents();
    fillGoalInputs();
}

function mealCard(meal) {
    const totals = meal.entries.reduce((acc, entry) => addMacros(acc, entry.macros), zeroMacros());
    return `
        <div class="meal-card" data-meal-id="${meal.id}">
            <div class="meal-head">
                <div>
                    <div class="meal-name">${escapeHtml(meal.name)}</div>
                    <div class="meal-meta">${meal.entries.length} itens registrados</div>
                </div>
                <div class="macro-chips">
                    <span class="chip">${totals.calories.toFixed(0)} kcal</span>
                    <span class="chip">P ${totals.protein.toFixed(1)}</span>
                    <span class="chip">C ${totals.carbs.toFixed(1)}</span>
                    <span class="chip">G ${totals.fat.toFixed(1)}</span>
                </div>
            </div>
            <div class="meal-form">
                <label class="field full">
                    <span>Buscar alimento</span>
                    <div class="field-wrap">
                        <input data-food-search="${meal.id}" placeholder="Digite para buscar: frang, arroz, whey...">
                        <div class="suggestions" data-suggestions="${meal.id}" hidden></div>
                    </div>
                </label>
                <div class="form-grid" style="margin-top:0;">
                    <label class="field">
                        <span>Quantidade consumida</span>
                        <input data-food-amount="${meal.id}" type="number" min="0" step="0.1" placeholder="150">
                    </label>
                    <label class="field">
                        <span>Referencia</span>
                        <input data-food-unit="${meal.id}" placeholder="a unidade base aparece aqui" readonly>
                    </label>
                </div>
                <div class="inline-actions">
                    <button class="action-btn" type="button" data-add-entry="${meal.id}">adicionar alimento</button>
                </div>
            </div>
            <div class="day-entries" style="margin-top:1rem;">
                ${meal.entries.length ? meal.entries.map((entry) => entryView(meal.id, entry)).join('') : '<div class="empty">Nenhum alimento registrado nesta refeicao ainda.</div>'}
            </div>
        </div>
    `;
}

function entryView(mealId, entry) {
    return `
        <div class="entry-card">
            <div class="entry-head">
                <div>
                    <div class="entry-title">${escapeHtml(entry.foodName)}</div>
                    <div class="entry-sub">${entry.amount} ${escapeHtml(entry.unit)} · base ${entry.baseAmount} ${escapeHtml(entry.baseUnit)}</div>
                </div>
                <div class="inline-actions">
                    <span class="active-badge">${entry.macros.calories.toFixed(0)} kcal</span>
                    <button class="danger-btn" type="button" data-remove-entry="${mealId}:${entry.id}">x</button>
                </div>
            </div>
            <div class="macro-chips" style="margin-top:0.75rem;">
                <span class="chip">P ${entry.macros.protein.toFixed(1)} g</span>
                <span class="chip">C ${entry.macros.carbs.toFixed(1)} g</span>
                <span class="chip">G ${entry.macros.fat.toFixed(1)} g</span>
            </div>
        </div>
    `;
}

function attachMealEvents() {
    document.querySelectorAll('[data-food-search]').forEach((input) => {
        input.addEventListener('input', () => updateSuggestions(input.dataset.foodSearch));
        input.addEventListener('focus', () => updateSuggestions(input.dataset.foodSearch));
        input.addEventListener('blur', () => {
            setTimeout(() => hideSuggestions(input.dataset.foodSearch), 120);
        });
    });

    document.querySelectorAll('[data-add-entry]').forEach((button) => {
        button.addEventListener('click', () => addMealEntry(button.dataset.addEntry));
    });

    document.querySelectorAll('[data-remove-entry]').forEach((button) => {
        button.addEventListener('click', () => {
            const [mealId, entryId] = button.dataset.removeEntry.split(':');
            removeMealEntry(mealId, entryId);
        });
    });
}

function renderFoods() {
    const foods = [...state.foods].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    foodList.innerHTML = foods.map((food) => `
        <div class="food-row">
            <div class="food-head">
                <div>
                    <div class="food-name">${escapeHtml(food.name)}</div>
                    <div class="food-portion">${food.servingAmount} ${escapeHtml(food.servingUnit)} · ${foodCalories(food).toFixed(0)} kcal</div>
                </div>
                <div class="inline-actions">
                    <button class="mini-btn" type="button" data-edit-food="${food.id}">editar</button>
                    <button class="danger-btn" type="button" data-delete-food="${food.id}">apagar</button>
                </div>
            </div>
            <div class="macro-chips" style="margin-top:0.75rem;">
                <span class="chip">P ${food.protein.toFixed(1)} g</span>
                <span class="chip">C ${food.carbs.toFixed(1)} g</span>
                <span class="chip">G ${food.fat.toFixed(1)} g</span>
            </div>
        </div>
    `).join('');

    foodList.querySelectorAll('[data-edit-food]').forEach((button) => {
        button.addEventListener('click', () => editFood(button.dataset.editFood));
    });
    foodList.querySelectorAll('[data-delete-food]').forEach((button) => {
        button.addEventListener('click', () => deleteFood(button.dataset.deleteFood));
    });
}

function renderHistory() {
    const days = Object.entries(state.days)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 12);

    historyList.innerHTML = days.map(([date, day]) => {
        const totals = dayTotals(day);
        return `
            <div class="food-row">
                <div class="food-head">
                    <div>
                        <div class="food-name">${formatDate(date)}</div>
                        <div class="food-portion">${countEntries(day)} itens registrados</div>
                    </div>
                    <span class="active-badge">${totals.calories.toFixed(0)} kcal</span>
                </div>
                <div class="macro-chips" style="margin-top:0.75rem;">
                    <span class="chip">P ${totals.protein.toFixed(1)} g</span>
                    <span class="chip">C ${totals.carbs.toFixed(1)} g</span>
                    <span class="chip">G ${totals.fat.toFixed(1)} g</span>
                </div>
            </div>
        `;
    }).join('') || '<div class="empty">Conforme voce registrar refeicoes, os dias anteriores vao aparecer aqui.</div>';
}

function renderMarket() {
    const items = [...state.market].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    marketList.innerHTML = items.map((item) => {
        const buy = Math.max(0, Number(item.needed || 0) - Number(item.have || 0));
        return `
            <div class="market-card">
                <div class="market-top">
                    <div>
                        <div class="market-name">${escapeHtml(item.name)}</div>
                        <div class="market-sub">${item.linkedFoodId ? 'vinculado a alimento da base' : 'item manual'} · unidade ${escapeHtml(item.unit)}</div>
                    </div>
                    <div class="inline-actions">
                        <button class="mini-btn" type="button" data-edit-market="${item.id}">editar</button>
                        <button class="danger-btn" type="button" data-delete-market="${item.id}">apagar</button>
                    </div>
                </div>
                <div class="market-stats">
                    <div class="market-stat">
                        <div class="label">Preciso</div>
                        <strong>${formatQty(item.needed)} ${escapeHtml(item.unit)}</strong>
                    </div>
                    <div class="market-stat">
                        <div class="label">Tenho</div>
                        <strong>${formatQty(item.have)} ${escapeHtml(item.unit)}</strong>
                    </div>
                    <div class="market-stat">
                        <div class="label">Comprar</div>
                        <strong>${formatQty(buy)} ${escapeHtml(item.unit)}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<div class="empty">Adicione os itens da proxima semana para montar sua lista de compras.</div>';

    const shopping = items.filter((item) => (Number(item.needed || 0) - Number(item.have || 0)) > 0);
    shoppingList.innerHTML = shopping.map((item) => {
        const buy = Math.max(0, Number(item.needed || 0) - Number(item.have || 0));
        return `
            <div class="entry-card">
                <div class="entry-head">
                    <div>
                        <div class="entry-title">${escapeHtml(item.name)}</div>
                        <div class="entry-sub">preciso ${formatQty(item.needed)} · tenho ${formatQty(item.have)}</div>
                    </div>
                    <span class="active-badge">${formatQty(buy)} ${escapeHtml(item.unit)}</span>
                </div>
            </div>
        `;
    }).join('') || '<div class="empty">Nada para comprar no momento.</div>';

    marketList.querySelectorAll('[data-edit-market]').forEach((button) => {
        button.addEventListener('click', () => editMarketItem(button.dataset.editMarket));
    });
    marketList.querySelectorAll('[data-delete-market]').forEach((button) => {
        button.addEventListener('click', () => deleteMarketItem(button.dataset.deleteMarket));
    });
}

function updateSuggestions(mealId) {
    const input = document.querySelector(`[data-food-search="${mealId}"]`);
    const panel = document.querySelector(`[data-suggestions="${mealId}"]`);
    const query = input.value.trim().toLowerCase();

    if (!query) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    const matches = state.foods
        .filter((food) => food.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .slice(0, 6);

    if (!matches.length) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    panel.innerHTML = matches.map((food) => `
        <div class="suggestion" data-select-food="${mealId}:${food.id}">
            <strong>${escapeHtml(food.name)}</strong>
            <span>${food.servingAmount} ${escapeHtml(food.servingUnit)} · P ${food.protein.toFixed(1)} · C ${food.carbs.toFixed(1)} · G ${food.fat.toFixed(1)}</span>
        </div>
    `).join('');
    panel.hidden = false;

    panel.querySelectorAll('[data-select-food]').forEach((item) => {
        item.addEventListener('click', () => {
            const [, foodId] = item.dataset.selectFood.split(':');
            selectFoodSuggestion(mealId, foodId);
        });
    });
}

function selectFoodSuggestion(mealId, foodId) {
    const food = state.foods.find((item) => item.id === foodId);
    if (!food) return;
    const input = document.querySelector(`[data-food-search="${mealId}"]`);
    const amountInput = document.querySelector(`[data-food-amount="${mealId}"]`);
    const unitInput = document.querySelector(`[data-food-unit="${mealId}"]`);
    input.value = food.name;
    input.dataset.selectedFoodId = food.id;
    amountInput.value = food.servingAmount;
    amountInput.dataset.selectedFoodId = food.id;
    unitInput.value = `${food.servingAmount} ${food.servingUnit}`;
    hideSuggestions(mealId);
}

function hideSuggestions(mealId) {
    const panel = document.querySelector(`[data-suggestions="${mealId}"]`);
    if (panel) {
        panel.hidden = true;
        panel.innerHTML = '';
    }
}

function updateMarketSuggestions() {
    const input = document.getElementById('market-food-search');
    const panel = document.getElementById('market-suggestions');
    const query = input.value.trim().toLowerCase();

    if (!query) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    const matches = state.foods
        .filter((food) => food.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .slice(0, 6);

    if (!matches.length) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    panel.innerHTML = matches.map((food) => `
        <div class="suggestion" data-market-food="${food.id}">
            <strong>${escapeHtml(food.name)}</strong>
            <span>${food.servingAmount} ${escapeHtml(food.servingUnit)} · ${foodCalories(food).toFixed(0)} kcal</span>
        </div>
    `).join('');
    panel.hidden = false;

    panel.querySelectorAll('[data-market-food]').forEach((item) => {
        item.addEventListener('click', () => selectMarketFood(item.dataset.marketFood));
    });
}

function selectMarketFood(foodId) {
    const food = state.foods.find((item) => item.id === foodId);
    if (!food) return;
    marketFormState.linkedFoodId = food.id;
    document.getElementById('market-food-search').value = food.name;
    document.getElementById('market-manual-name').value = '';
    document.getElementById('market-unit').value = food.servingUnit;
    hideMarketSuggestions();
}

function hideMarketSuggestions() {
    const panel = document.getElementById('market-suggestions');
    panel.hidden = true;
    panel.innerHTML = '';
}

async function addMealEntry(mealId) {
    const searchInput = document.querySelector(`[data-food-search="${mealId}"]`);
    const amountInput = document.querySelector(`[data-food-amount="${mealId}"]`);
    const selectedFoodId = searchInput.dataset.selectedFoodId;
    const food = state.foods.find((item) => item.id === selectedFoodId);
    if (!food) {
        window.alert('Escolha um alimento da sugestao antes de adicionar.');
        return;
    }

    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) {
        window.alert('Informe a quantidade consumida.');
        return;
    }

    const factor = amount / Number(food.servingAmount || 1);
    const entry = {
        id: uid(),
        foodId: food.id,
        foodName: food.name,
        amount,
        unit: food.servingUnit,
        baseAmount: food.servingAmount,
        baseUnit: food.servingUnit,
        macros: {
            protein: round1(food.protein * factor),
            carbs: round1(food.carbs * factor),
            fat: round1(food.fat * factor),
            calories: round1(foodCalories(food) * factor),
        },
    };

    const meal = getCurrentDay().meals.find((item) => item.id === mealId);
    meal.entries.unshift(entry);
    clearMealDraft(mealId);
    await saveState();
    render();
}

function clearMealDraft(mealId) {
    const searchInput = document.querySelector(`[data-food-search="${mealId}"]`);
    const amountInput = document.querySelector(`[data-food-amount="${mealId}"]`);
    const unitInput = document.querySelector(`[data-food-unit="${mealId}"]`);
    searchInput.value = '';
    searchInput.dataset.selectedFoodId = '';
    amountInput.value = '';
    unitInput.value = '';
    hideSuggestions(mealId);
}

async function removeMealEntry(mealId, entryId) {
    const meal = getCurrentDay().meals.find((item) => item.id === mealId);
    if (!meal) return;
    meal.entries = meal.entries.filter((entry) => entry.id !== entryId);
    await saveState();
    render();
}

async function clearCurrentDay() {
    if (!window.confirm('Limpar todas as refeicoes do dia atual?')) return;
    state.days[currentDateInput.value] = {
        meals: mealOrder.map((name) => ({ id: uid(), name, entries: [] })),
    };
    await saveState();
    render();
}

async function saveGoals() {
    state.goals = {
        calories: Number(document.getElementById('goal-calories').value) || 0,
        protein: Number(document.getElementById('goal-protein').value) || 0,
        carbs: Number(document.getElementById('goal-carbs').value) || 0,
        fat: Number(document.getElementById('goal-fat').value) || 0,
    };
    await saveState();
    render();
}

function fillGoalInputs() {
    document.getElementById('goal-calories').value = state.goals.calories || '';
    document.getElementById('goal-protein').value = state.goals.protein || '';
    document.getElementById('goal-carbs').value = state.goals.carbs || '';
    document.getElementById('goal-fat').value = state.goals.fat || '';
}

async function saveFoodFromForm() {
    const food = {
        id: foodFormState.id || uid(),
        name: document.getElementById('food-name').value.trim(),
        servingAmount: Number(document.getElementById('food-serving-amount').value) || 0,
        servingUnit: document.getElementById('food-serving-unit').value.trim(),
        protein: Number(document.getElementById('food-protein').value) || 0,
        carbs: Number(document.getElementById('food-carbs').value) || 0,
        fat: Number(document.getElementById('food-fat').value) || 0,
    };

    if (!food.name || !food.servingAmount || !food.servingUnit) {
        window.alert('Preencha nome, porcao base e unidade.');
        return;
    }

    const index = state.foods.findIndex((item) => item.id === food.id);
    if (index >= 0) {
        state.foods.splice(index, 1, food);
    } else {
        state.foods.unshift(food);
    }
    resetFoodForm();
    await saveState();
    render();
}

async function saveMarketItem() {
    const linkedFoodId = marketFormState.linkedFoodId || null;
    const linkedFood = linkedFoodId ? state.foods.find((item) => item.id === linkedFoodId) : null;
    const manualName = document.getElementById('market-manual-name').value.trim();
    const item = {
        id: marketFormState.id || uid(),
        linkedFoodId,
        name: linkedFood ? linkedFood.name : manualName,
        needed: Number(document.getElementById('market-needed').value) || 0,
        have: Number(document.getElementById('market-have').value) || 0,
        unit: document.getElementById('market-unit').value.trim(),
    };

    if (!item.name || !item.unit || !item.needed) {
        window.alert('Preencha nome, quantidade necessaria e unidade.');
        return;
    }

    const index = state.market.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
        state.market.splice(index, 1, item);
    } else {
        state.market.unshift(item);
    }
    resetMarketForm();
    await saveState();
    render();
}

function editMarketItem(itemId) {
    const item = state.market.find((entry) => entry.id === itemId);
    if (!item) return;
    marketFormState = { id: item.id, linkedFoodId: item.linkedFoodId || null };
    document.getElementById('market-food-search').value = item.linkedFoodId ? item.name : '';
    document.getElementById('market-manual-name').value = item.linkedFoodId ? '' : item.name;
    document.getElementById('market-needed').value = item.needed;
    document.getElementById('market-have').value = item.have;
    document.getElementById('market-unit').value = item.unit;
    switchTab('market');
}

async function deleteMarketItem(itemId) {
    if (!window.confirm('Apagar este item da lista de mercado?')) return;
    state.market = state.market.filter((entry) => entry.id !== itemId);
    await saveState();
    render();
}

function resetMarketForm() {
    marketFormState = { id: null, linkedFoodId: null };
    ['market-food-search', 'market-manual-name', 'market-needed', 'market-have', 'market-unit']
        .forEach((id) => { document.getElementById(id).value = ''; });
    hideMarketSuggestions();
}

function editFood(foodId) {
    const food = state.foods.find((item) => item.id === foodId);
    if (!food) return;
    foodFormState.id = food.id;
    document.getElementById('food-name').value = food.name;
    document.getElementById('food-serving-amount').value = food.servingAmount;
    document.getElementById('food-serving-unit').value = food.servingUnit;
    document.getElementById('food-protein').value = food.protein;
    document.getElementById('food-carbs').value = food.carbs;
    document.getElementById('food-fat').value = food.fat;
    foodEditorTitle.textContent = 'Editar alimento';
    switchTab('foods');
}

async function deleteFood(foodId) {
    if (!window.confirm('Apagar este alimento da sua base?')) return;
    state.foods = state.foods.filter((item) => item.id !== foodId);
    Object.values(state.days).forEach((day) => {
        day.meals.forEach((meal) => {
            meal.entries = meal.entries.filter((entry) => entry.foodId !== foodId);
        });
    });
    await saveState();
    render();
}

function resetFoodForm() {
    foodFormState = { id: null };
    foodEditorTitle.textContent = 'Novo alimento';
    ['food-name', 'food-serving-amount', 'food-serving-unit', 'food-protein', 'food-carbs', 'food-fat']
        .forEach((id) => { document.getElementById(id).value = ''; });
}

async function saveState() {
    try {
        const response = await fetch('/api/food/state', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state),
        });
        if (!response.ok) throw new Error('save failed');
        lastSaved.textContent = `ultima sincronizacao ${timeLabel(new Date())}`;
    } catch (error) {
        lastSaved.textContent = 'alteracoes nao sincronizadas';
        window.alert('Nao foi possivel salvar no servidor.');
    }
}

function switchTab(tabId) {
    activeTab = tabId;
    renderTabs();
}

function getCurrentDay() {
    ensureCurrentDay();
    return state.days[currentDateInput.value];
}

function dayTotals(day) {
    return day.meals.reduce((acc, meal) => {
        const mealSum = meal.entries.reduce((entryAcc, entry) => addMacros(entryAcc, entry.macros), zeroMacros());
        return addMacros(acc, mealSum);
    }, zeroMacros());
}

function countEntries(day) {
    return day.meals.reduce((sum, meal) => sum + meal.entries.length, 0);
}

function addMacros(a, b) {
    return {
        calories: a.calories + (b.calories || 0),
        protein: a.protein + (b.protein || 0),
        carbs: a.carbs + (b.carbs || 0),
        fat: a.fat + (b.fat || 0),
    };
}

function zeroMacros() {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function foodCalories(food) {
    return (Number(food.protein) || 0) * 4 + (Number(food.carbs) || 0) * 4 + (Number(food.fat) || 0) * 9;
}

function round1(value) {
    return Math.round(value * 10) / 10;
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function timeLabel(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatQty(value) {
    return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
