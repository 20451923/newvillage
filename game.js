(() => {
  'use strict';

  const SAVE_KEY = 'hearthside-save-v1';
  const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
  const RESOURCE_LABELS = {
    wood: { label: 'Wood', icon: '♧' },
    stone: { label: 'Stone', icon: '◈' },
    berries: { label: 'Berries', icon: '●' },
    fish: { label: 'Fish', icon: '≈' },
    coins: { label: 'Coins', icon: '✦' },
    petals: { label: 'Petals', icon: '✿' }
  };
  const BUILDINGS = [
    { id: 'cottage', name: 'Little cottage', icon: '🏡', description: 'A cozy place to rest', income: 'A place to call home', cost: { wood: 12, berries: 3 } },
    { id: 'garden', name: 'Berry garden', icon: '🌿', description: 'A handful every minute', income: '+1 berry / 30 sec', cost: { wood: 8, stone: 3 } },
    { id: 'lumbermill', name: 'Woodcutter’s nook', icon: '♧', description: 'Keeps the woodpile growing', income: '+1 wood / 20 sec', cost: { wood: 10, stone: 5 } }
  ];
  const QUESTS = [
    { id: 'gather', title: 'A place to call home', description: 'Gather wood from the meadow and get a little cottage started.', icon: '🪵', type: 'gathered', resource: 'wood', target: 12, unit: 'wood gathered', reward: { coins: 8, berries: 3 } },
    { id: 'upgrade', title: 'Room to grow', description: 'Give any building a thoughtful little upgrade.', icon: '🏡', type: 'upgrades', target: 1, unit: 'building upgraded', reward: { coins: 12, wood: 5 } },
    { id: 'fish', title: 'A catch for supper', description: 'Take a peaceful break by Willowmere and catch a fish.', icon: '🎣', type: 'fishCaught', target: 1, unit: 'fish caught', reward: { coins: 10, berries: 4 } },
    { id: 'boar', title: 'The grumpy neighbor', description: 'Explore the Mossy Trail and meet the boar everyone talks about.', icon: '🐗', type: 'boarsDefeated', target: 1, unit: 'boar befriended', reward: { coins: 18, stone: 5 } }
  ];
  const FISH_NAMES = ['a silvery minnnow', 'a little lake perch', 'a stripey sunfish', 'a speckled trout'];
  const BOAR_LINES = [
    'A grumpy boar blocks the trail. Looks like it just wants a little space.',
    'The boar gives a mighty snort and stomps the ground.',
    'It’s looking less grumpy already. Maybe it just needed a snack.',
    'The boar has had enough for today. It trots off toward the ferns!'
  ];
  const $ = (selector) => document.querySelector(selector);
  const number = (value) => Math.max(0, Math.floor(Number(value) || 0));

  function defaultState() {
    return {
      resources: { wood: 8, stone: 4, berries: 8, fish: 0, coins: 0, petals: 0 },
      buildings: { cottage: 0, garden: 0, lumbermill: 0 },
      stats: { gathered: { wood: 0, berries: 0 }, upgrades: 0, fishCaught: 0, boarsDefeated: 0, visits: 0, fishStreak: 0 },
      productionRemainder: { wood: 0, berries: 0 },
      questsClaimed: [],
      totalFish: 0,
      expedition: { active: false, hp: 3, maxHp: 3, round: 0, log: '' },
      day: 1,
      lastSaved: Date.now()
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { state: defaultState(), offlineSeconds: 0 };
      const parsed = JSON.parse(raw);
      const initial = defaultState();
      const state = {
        ...initial,
        ...parsed,
        resources: { ...initial.resources, ...(parsed.resources || {}) },
        buildings: { ...initial.buildings, ...(parsed.buildings || {}) },
        stats: { ...initial.stats, ...(parsed.stats || {}), gathered: { ...initial.stats.gathered, ...(parsed.stats?.gathered || {}) } },
        productionRemainder: { ...initial.productionRemainder, ...(parsed.productionRemainder || {}) },
        questsClaimed: Array.isArray(parsed.questsClaimed) ? parsed.questsClaimed.filter((id) => QUESTS.some((quest) => quest.id === id)) : [],
        expedition: { ...initial.expedition, ...(parsed.expedition || {}) }
      };
      for (const resource of Object.keys(state.resources)) state.resources[resource] = number(state.resources[resource]);
      for (const building of Object.keys(state.buildings)) state.buildings[building] = number(state.buildings[building]);
      const savedAt = Number(parsed.lastSaved);
      const elapsed = Math.max(0, Math.floor((Date.now() - (Number.isFinite(savedAt) && savedAt > 0 ? savedAt : Date.now())) / 1000));
      const offlineSeconds = Math.min(OFFLINE_CAP_SECONDS, elapsed);
      addProduction(state, offlineSeconds);
      state.day += Math.floor(offlineSeconds / (60 * 60));
      state.lastSaved = Date.now();
      return { state, offlineSeconds };
    } catch (error) {
      console.error('Could not read the village save.', error);
      return { state: defaultState(), offlineSeconds: 0, corrupted: true };
    }
  }

  function addProduction(target, seconds) {
    for (const [resource, building, interval] of [
      ['wood', 'lumbermill', 20],
      ['berries', 'garden', 30]
    ]) {
      const level = target.buildings[building];
      if (!level) continue;
      const elapsed = target.productionRemainder[resource] + seconds;
      target.resources[resource] += Math.floor(elapsed / interval) * level;
      target.productionRemainder[resource] = elapsed % interval;
    }
  }

  let { state, offlineSeconds, corrupted } = loadState();
  let toastTimer;
  let castCooldown = false;
  let lastCatchAt = Date.now();

  function save() {
    state.lastSaved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      $('#save-status').innerHTML = '<span class="save-dot"></span> Your progress is saved';
    } catch (error) {
      console.error('Could not save your village.', error);
      $('#save-status').innerHTML = '<span class="save-dot"></span> Save unavailable';
    }
  }

  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
  }

  function canAfford(cost) {
    return Object.entries(cost).every(([resource, amount]) => state.resources[resource] >= amount);
  }

  function spend(cost) {
    if (!canAfford(cost)) return false;
    for (const [resource, amount] of Object.entries(cost)) state.resources[resource] -= amount;
    return true;
  }

  function addResources(rewards) {
    for (const [resource, amount] of Object.entries(rewards)) {
      if (Object.hasOwn(state.resources, resource)) state.resources[resource] += amount;
    }
  }

  function costText(cost) {
    return Object.entries(cost).map(([resource, amount]) => `${RESOURCE_LABELS[resource].icon} ${amount}`).join('  ');
  }

  function questProgress(quest) {
    if (quest.type === 'gathered') return state.stats.gathered[quest.resource];
    return state.stats[quest.type];
  }

  function isQuestComplete(quest) {
    return questProgress(quest) >= quest.target;
  }

  function renderResources() {
    for (const resource of ['wood', 'stone', 'berries', 'fish', 'coins']) {
      $(`#${resource}-count`).textContent = state.resources[resource].toLocaleString();
    }
    $('#day-count').textContent = state.day;
    $('#scene-day').textContent = state.day;
    $('#fish-total').textContent = state.totalFish;
    $('#fish-streak').textContent = `${state.stats.fishStreak} ${state.stats.fishStreak === 1 ? 'day' : 'days'}`;
  }

  function renderBuildings() {
    $('#building-grid').innerHTML = BUILDINGS.map((building) => {
      const level = state.buildings[building.id];
      const cost = Object.fromEntries(Object.entries(building.cost).map(([resource, amount]) => [resource, amount * (level + 1)]));
      const effect = building.id === 'garden'
        ? `+${level} ${level === 1 ? 'berry' : 'berries'} / 30 sec`
        : building.id === 'lumbermill'
          ? `+${level} wood / 20 sec`
          : building.income;
      return `<article class="building-card">
        <div class="building-top"><span class="building-icon">${building.icon}</span><span class="building-level">Level ${level}</span></div>
        <h3>${building.name}</h3><p>${building.description}</p>
        <div class="building-bottom"><span class="building-income">${effect}</span><button class="upgrade-button" type="button" data-upgrade="${building.id}" ${canAfford(cost) ? '' : 'disabled'}>${level ? 'Upgrade' : 'Build'} · ${costText(cost)}</button></div>
      </article>`;
    }).join('');
  }

  function renderHomeQuest() {
    const quest = QUESTS.find((item) => item.id === 'gather');
    const progress = Math.min(questProgress(quest), quest.target);
    $('#home-quest-progress-text').textContent = `${progress} / ${quest.target} ${quest.unit}`;
    $('#home-quest-percent').textContent = `${Math.floor(progress / quest.target * 100)}%`;
    $('#home-quest-progress-bar').style.width = `${progress / quest.target * 100}%`;
    if (state.questsClaimed.includes(quest.id)) {
      $('#home-quest-title').textContent = 'A lovely start!';
      $('#home-quest-copy').textContent = 'You’ve made a wonderful start. There are more friendly requests waiting in your journal.';
    } else if (isQuestComplete(quest)) {
      $('#home-quest-title').textContent = 'A place to call home';
      $('#home-quest-copy').textContent = 'You’ve got the supplies. Pop into your quests to collect a little thank-you.';
    }
  }

  function renderQuests() {
    const completeCount = state.questsClaimed.length;
    $('#quests-completed-count').textContent = `${completeCount} / ${QUESTS.length} complete`;
    $('.quest-dot').classList.toggle('hidden', QUESTS.some((quest) => isQuestComplete(quest) && !state.questsClaimed.includes(quest.id)));
    $('#quest-list').innerHTML = QUESTS.map((quest) => {
      const current = Math.min(questProgress(quest), quest.target);
      const complete = isQuestComplete(quest);
      const claimed = state.questsClaimed.includes(quest.id);
      const progress = current / quest.target * 100;
      const reward = Object.entries(quest.reward).map(([resource, amount]) => `${RESOURCE_LABELS[resource].icon} ${amount} ${RESOURCE_LABELS[resource].label}`).join(' · ');
      return `<article class="quest-card ${claimed ? 'is-done' : ''}">
        <div class="quest-card-top"><span class="quest-icon">${quest.icon}</span><div><h3>${quest.title}</h3><p>${quest.description}</p></div><span class="quest-status">${claimed ? 'COMPLETE' : complete ? 'READY' : 'IN PROGRESS'}</span></div>
        <div class="quest-card-bottom"><div class="quest-card-progress"><div class="progress-label"><span>${current} / ${quest.target} ${quest.unit}</span><strong>${Math.floor(progress)}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div></div><span class="quest-reward">✦ ${reward}</span><button class="quest-claim" type="button" data-claim="${quest.id}" ${complete && !claimed ? '' : 'disabled'}>${claimed ? 'Done ✓' : 'Claim'}</button></div>
      </article>`;
    }).join('');
  }

  function renderInventory() {
    $('#inventory-details').innerHTML = Object.entries(RESOURCE_LABELS).map(([resource, info]) => `
      <div class="inventory-item">${info.icon} ${info.label}<strong>${state.resources[resource]}</strong></div>`).join('');
  }

  function renderExpedition() {
    const panel = $('#expedition-panel');
    const card = $('#combat-card');
    if (state.expedition.active) {
      panel.classList.add('hidden');
      card.classList.remove('hidden');
      const hp = Math.max(0, state.expedition.hp);
      const progress = Math.max(0, hp / state.expedition.maxHp * 100);
      card.innerHTML = `<div class="combat-top"><div><p class="eyebrow">A LITTLE ENCOUNTER</p><h3>A wild woodland boar</h3><p>It’s more startled than dangerous. A friendly wave might do the trick.</p></div><span class="quest-icon">🐗</span></div><div class="progress-label"><span>Boar’s patience</span><strong>${hp} / ${state.expedition.maxHp}</strong></div><div class="health-track"><div class="health-fill" style="width:${progress}%"></div></div><div class="combat-actions"><button class="primary-button" data-combat="toss" type="button">${hp === 1 ? 'Offer last berry' : 'Offer a berry'} <span>♥</span></button><button class="upgrade-button" data-combat="leave" type="button">Head back</button></div><p class="combat-log" aria-live="polite">${state.expedition.log || BOAR_LINES[0]}</p>`;
    } else {
      card.classList.add('hidden');
      panel.classList.remove('hidden');
      if (state.stats.boarsDefeated) {
        panel.innerHTML = '<span class="panel-emoji">🌼</span><div><h3>The boar’s a friend now</h3><p>It left a few things by the trail. Maybe you’ll meet another neighbor next time.</p></div><span class="trail-badge">FRIENDS</span>';
      }
    }
    $('#start-explore').disabled = state.expedition.active || state.resources.berries < 1;
  }

  function renderAll() {
    renderResources();
    renderBuildings();
    renderHomeQuest();
    renderQuests();
    renderInventory();
    renderExpedition();
  }

  function markGathered(resource, amount) {
    state.resources[resource] += amount;
    state.stats.gathered[resource] += amount;
    renderAll();
    save();
  }

  function gather(resource) {
    const amount = resource === 'wood' ? 3 : 2;
    markGathered(resource, amount);
    $('#action-hint').textContent = resource === 'wood' ? 'The trees are generous today.' : 'Sweet, tart, and just right for a walk.';
    toast(`+${amount} ${RESOURCE_LABELS[resource].label.toLowerCase()} gathered`);
  }

  function upgrade(buildingId) {
    const building = BUILDINGS.find((item) => item.id === buildingId);
    if (!building) return;
    const level = state.buildings[buildingId];
    const cost = Object.fromEntries(Object.entries(building.cost).map(([resource, amount]) => [resource, amount * (level + 1)]));
    if (!spend(cost)) {
      toast('You’re a little short on supplies. Try gathering nearby.');
      return;
    }
    state.buildings[buildingId] += 1;
    state.stats.upgrades += 1;
    renderAll();
    save();
    toast(`${building.name} is looking lovely!`);
  }

  function navigate(view) {
    if (!$(`#view-${view}`)) return;
    document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startExpedition() {
    if (state.expedition.active) return;
    if (!spend({ berries: 1 })) {
      toast('Bring one berry for the walk. The meadow is just outside!');
      return;
    }
    state.expedition = { active: true, hp: 3, maxHp: 3, round: 0, log: BOAR_LINES[0] };
    renderAll();
    save();
    toast('Off you go, down the Mossy Trail!');
  }

  function combat(action) {
    if (!state.expedition.active) return;
    if (action === 'leave') {
      state.expedition = defaultState().expedition;
      renderAll();
      save();
      toast('Back home, safe and sound.');
      return;
    }
    if (state.resources.berries < 1) {
      state.expedition.log = 'You’ve run out of berries to share. Head home and gather a few more.';
      renderExpedition();
      return;
    }
    state.resources.berries -= 1;
    state.expedition.hp -= 1;
    state.expedition.round += 1;
    if (state.expedition.hp <= 0) {
      const rewards = { wood: 4, stone: 2, petals: 2 };
      addResources(rewards);
      state.stats.boarsDefeated += 1;
      state.expedition = defaultState().expedition;
      renderAll();
      save();
      toast('A new friend — and a few things for the road!');
      return;
    }
    state.expedition.log = BOAR_LINES[Math.min(state.expedition.round, BOAR_LINES.length - 1)];
    renderAll();
    save();
  }

  function fish() {
    if (castCooldown) return;
    castCooldown = true;
    $('#cast-line').disabled = true;
    const fishName = FISH_NAMES[Math.floor(Math.random() * FISH_NAMES.length)];
    state.resources.fish += 1;
    state.totalFish += 1;
    state.stats.fishCaught += 1;
    state.stats.fishStreak = Date.now() - lastCatchAt > 60_000 ? state.stats.fishStreak + 1 : Math.max(1, state.stats.fishStreak);
    lastCatchAt = Date.now();
    $('#fishing-result').textContent = `You caught ${fishName}! What a lovely surprise.`;
    renderAll();
    save();
    toast('A little fish for your pockets!');
    setTimeout(() => {
      castCooldown = false;
      $('#cast-line').disabled = false;
    }, 850);
  }

  function claimQuest(id) {
    const quest = QUESTS.find((item) => item.id === id);
    if (!quest || state.questsClaimed.includes(id) || !isQuestComplete(quest)) return;
    state.questsClaimed.push(id);
    addResources(quest.reward);
    renderAll();
    save();
    toast(`Quest complete! ${Object.entries(quest.reward).map(([resource, amount]) => `+${amount} ${RESOURCE_LABELS[resource].label.toLowerCase()}`).join(' · ')}`);
  }

  function restart() {
    if (!window.confirm('Start a new story? Your current village and its saved progress will be cleared.')) return;
    state = defaultState();
    lastCatchAt = Date.now();
    save();
    renderAll();
    navigate('village');
    toast('A fresh new story begins.');
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-view]');
    if (nav) navigate(nav.dataset.view);
    const navigateButton = event.target.closest('[data-navigate]');
    if (navigateButton) navigate(navigateButton.dataset.navigate);
    const gatherButton = event.target.closest('[data-gather]');
    if (gatherButton) gather(gatherButton.dataset.gather);
    const upgradeButton = event.target.closest('[data-upgrade]');
    if (upgradeButton) upgrade(upgradeButton.dataset.upgrade);
    const claimButton = event.target.closest('[data-claim]');
    if (claimButton) claimQuest(claimButton.dataset.claim);
    const combatButton = event.target.closest('[data-combat]');
    if (combatButton) combat(combatButton.dataset.combat);
  });

  $('#start-explore').addEventListener('click', startExpedition);
  $('#cast-line').addEventListener('click', fish);
  $('#reset-game').addEventListener('click', restart);
  $('#restart-link').addEventListener('click', restart);
  $('#sound-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const muted = button.classList.toggle('is-muted');
    button.setAttribute('aria-label', muted ? 'Sound off' : 'Toggle sound');
    toast(muted ? 'Quiet mode is on.' : 'There’s no rush — enjoy the quiet.');
  });
  $('#inventory-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    $('#inventory-details').classList.toggle('hidden', expanded);
    button.innerHTML = expanded ? 'Details <span>⌄</span>' : 'Hide <span>⌃</span>';
  });

  setInterval(() => {
    if (!state.buildings.garden && !state.buildings.lumbermill) return;
    addProduction(state, 1);
    renderAll();
    save();
  }, 1000);
  window.addEventListener('beforeunload', save);

  renderAll();
  if (offlineSeconds > 0) {
    const hours = Math.floor(offlineSeconds / 3600);
    const minutes = Math.floor((offlineSeconds % 3600) / 60);
    const duration = hours ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
    setTimeout(() => toast(`Welcome back! Your village grew while you were away (${duration}, up to 8 hours).`), 450);
  } else if (corrupted) {
    setTimeout(() => toast('A fresh journal was started because the old save could not be read.'), 450);
  }
})();
