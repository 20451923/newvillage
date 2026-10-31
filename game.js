(() => {
  'use strict';

  const SAVE_KEY = 'hearthside-save-v1';
  const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
  const RESOURCE_LABELS = {
    wood: { label: 'Wood', icon: '♧' },
    stone: { label: 'Stone', icon: '◈' },
    iron: { label: 'Iron', icon: '⬡' },
    berries: { label: 'Berries', icon: '●' },
    fish: { label: 'Fish', icon: '≈' },
    coins: { label: 'Coins', icon: '✦' },
    petals: { label: 'Petals', icon: '✿' },
    stardust: { label: 'Stardust', icon: '✧' },
    shells: { label: 'Shells', icon: '🐚' }
  };
  const BUILDINGS = [
    { id: 'cottage', name: 'Little cottage', icon: '🏡', description: 'A cozy place to rest', income: 'A place to call home', cost: { wood: 12, berries: 3 } },
    { id: 'garden', name: 'Berry garden', icon: '🌿', description: 'A handful every minute', income: '+1 berry / 30 sec', cost: { wood: 8, stone: 3 } },
    { id: 'lumbermill', name: 'Woodcutter’s nook', icon: '♧', description: 'Keeps the woodpile growing', income: '+1 wood / 20 sec', cost: { wood: 10, stone: 5 } },
    { id: 'lookout', name: 'Lookout tower', icon: '⌕', description: 'A wider view of the valley', income: 'Find new places to explore', cost: { wood: 18, stone: 12 } },
    { id: 'workshop', name: 'Little workshop', icon: '⚒', description: 'A table for simple recipes', income: 'Unlocks the crafting table', cost: { wood: 16, stone: 8 } },
    { id: 'observatory', name: 'Star observatory', icon: '✧', description: 'A clearer view of the night sky', income: 'Makes stardust go further', cost: { wood: 24, stone: 16, petals: 4 } }
  ];
  const QUESTS = [
    { id: 'gather', title: 'A place to call home', description: 'Gather wood from the meadow and get a little cottage started.', icon: '🪵', type: 'gathered', resource: 'wood', target: 12, unit: 'wood gathered', reward: { coins: 8, berries: 3 } },
    { id: 'upgrade', title: 'Room to grow', description: 'Give any building a thoughtful little upgrade.', icon: '🏡', type: 'upgrades', target: 1, unit: 'building upgraded', reward: { coins: 12, wood: 5 } },
    { id: 'fish', title: 'A catch for supper', description: 'Take a peaceful break by Willowmere and catch a fish.', icon: '🎣', type: 'fishCaught', target: 1, unit: 'fish caught', reward: { coins: 10, berries: 4 } },
    { id: 'boar', title: 'The grumpy neighbor', description: 'Explore the Mossy Trail and meet the boar everyone talks about.', icon: '🐗', type: 'boarsDefeated', target: 1, unit: 'boar befriended', reward: { coins: 18, stone: 5 } },
    { id: 'guild', title: 'A friend for the road', description: 'Welcome another kind soul to your adventurers’ guild.', icon: '♙', type: 'guildSize', target: 2, unit: 'guild members', reward: { coins: 12, berries: 5 } },
    { id: 'voyage', title: 'Beyond the headland', description: 'Repair the dock and send your first boat across the bay.', icon: '⛵', type: 'voyages', target: 1, unit: 'sea voyage completed', reward: { shells: 2, stardust: 1 } },
    { id: 'stargazer', title: 'A map of the night sky', description: 'Find a pinch of stardust at Stargazer’s Bluff.', icon: '✧', type: 'bluffFinds', target: 1, unit: 'stardust found at the bluff', reward: { stardust: 2, petals: 3 } },
    { id: 'village', title: 'A village takes shape', description: 'Raise four buildings around your new home.', icon: '⌂', type: 'buildingLevels', target: 4, unit: 'building levels built', reward: { coins: 20, stardust: 1 } }
  ];
  const ACHIEVEMENTS = [
    { id: 'first-bundle', title: 'First bundle', description: 'Gather 12 wood.', icon: '♧', test: (s) => s.stats.gathered.wood >= 12, reward: { coins: 8 } },
    { id: 'village-heart', title: 'A village takes shape', description: 'Build your first cottage.', icon: '⌂', test: (s) => s.buildings.cottage >= 1, reward: { stardust: 1 } },
    { id: 'trailblazer', title: 'Trailblazer', description: 'Make three little expeditions.', icon: '↗', test: (s) => s.stats.expeditions >= 3, reward: { stardust: 2 } },
    { id: 'good-company', title: 'Good company', description: 'Welcome three adventurers to the guild.', icon: '♙', test: (s) => s.guild.roster.length >= 3, reward: { coins: 25, stardust: 1 } },
    { id: 'tide-turner', title: 'The tide turns', description: 'Complete a sea voyage.', icon: '⛵', test: (s) => s.sea.voyages >= 1, reward: { shells: 2, stardust: 2 } },
    { id: 'little-fisher', title: 'Little fisher', description: 'Catch five fish.', icon: '≈', test: (s) => s.stats.fishCaught >= 5, reward: { coins: 15, bait: 2 } },
    { id: 'star-gardener', title: 'Star gardener', description: 'Wake a constellation.', icon: '✧', test: (s) => s.astral.unlocked.length >= 1, reward: { stardust: 2 } },
    { id: 'old-friends', title: 'Old friends', description: 'Befriend three woodland neighbors.', icon: '♥', test: (s) => s.stats.boarsDefeated >= 3, reward: { petals: 5, stardust: 1 } }
  ];
  const LOCATIONS = [
    { id: 'trail', name: 'The Mossy Trail', icon: '🌲', description: 'Meet a grumpy woodland neighbor.', cost: { berries: 1 }, requirement: () => true, kind: 'combat' },
    { id: 'grove', name: 'Sunlit Grove', icon: '🌼', description: 'Pick sweet berries and fragrant petals.', cost: { berries: 1 }, requirement: (s) => s.stats.expeditions >= 1, kind: 'grove' },
    { id: 'quarry', name: 'Stonebrook Quarry', icon: '◈', description: 'Find good stone beneath the old hills.', cost: { berries: 1 }, requirement: (s) => s.buildings.cottage >= 1, kind: 'quarry' },
    { id: 'shore', name: 'Willowmere Shore', icon: '≈', description: 'Look for shells and little sea treasures.', cost: { berries: 1 }, requirement: (s) => s.sea.harborLevel >= 1, kind: 'shore' },
    { id: 'bluff', name: 'Stargazer’s Bluff', icon: '✧', description: 'Follow the stars to a pinch of stardust.', unlockText: 'Build a lookout and finish a sea voyage with an experienced guide.', cost: { berries: 2 }, requirement: (s) => s.buildings.lookout >= 1 && s.sea.voyages >= 1 && s.guild.roster.some((hero) => hero.level >= 2), kind: 'bluff' }
  ];
  const CONSTELLATIONS = [
    { id: 'hearth', name: 'The Hearth', icon: '⌂', description: 'Your village buildings produce 20% more.', bonus: 'Village production +20%', cost: 1 },
    { id: 'compass', name: 'The Wayfinder', icon: '✦', description: 'Your adventurers return from trips with extra finds.', bonus: 'Adventure rewards +20%', cost: 2 },
    { id: 'tide', name: 'The Tidal Garden', icon: '≈', description: 'Your harbor voyages bring home more treasure.', bonus: 'Sea voyage rewards +25%', cost: 3 }
  ];
  const RECIPES = [
    { id: 'tea', name: 'Soothing berry tea', icon: '☕', description: 'A healing sip for an adventurer on the trail.', cost: { berries: 3, petals: 1 }, output: { tea: 1 } },
    { id: 'bait', name: 'Wildflower bait', icon: '🪱', description: 'Better odds of a rare catch on your next line.', cost: { berries: 2, petals: 1 }, output: { bait: 2 } },
    { id: 'map', name: 'Hand-drawn map', icon: '🗺️', description: 'Mark the safest way through the next encounter.', cost: { wood: 3, petals: 2 }, output: { maps: 1 } }
  ];
  const DAILY_REWARDS = [
    { coins: 5, berries: 2 },
    { wood: 4, petals: 1 },
    { stone: 4, coins: 7 },
    { berries: 6, stardust: 1 },
    { wood: 8, fish: 2 },
    { coins: 15, petals: 2 },
    { coins: 20, stardust: 2 }
  ];
  const BOAR_LINES = [
    'A grumpy boar blocks the trail. Looks like it just wants a little space.',
    'The boar gives a mighty snort and stomps the ground.',
    'It’s looking less grumpy already. Maybe it just needed a snack.',
    'The boar has had enough for today. It trots off toward the ferns!'
  ];
  const $ = (selector) => document.querySelector(selector);
  const number = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function defaultState() {
    return {
      version: 2,
      resources: { wood: 8, stone: 4, iron: 0, berries: 8, fish: 0, coins: 0, petals: 0, stardust: 0, shells: 0 },
      buildings: { cottage: 0, garden: 0, lumbermill: 0, lookout: 0, workshop: 0, observatory: 0 },
      stats: { gathered: { wood: 0, berries: 0 }, locationTrips: {}, upgrades: 0, fishCaught: 0, boarsDefeated: 0, visits: 0, fishStreak: 0, expeditions: 0, stardustFound: 0, bluffFinds: 0 },
      productionRemainder: { wood: 0, berries: 0, fish: 0 },
      guild: { roster: [{ id: 'moss', name: 'Moss', role: 'forager', level: 1, xp: 0 }] },
      sea: { harborLevel: 0, voyageFinishAt: 0, voyages: 0, history: [] },
      astral: { unlocked: [], cycles: 0 },
      automation: { wood: false, berries: false, fish: false },
      items: { tea: 0, bait: 0, maps: 0, minnows: 0, perch: 0, trout: 0, glimmerfish: 0, oldBoots: 0 },
      achievements: [],
      daily: { lastClaimedOn: '', streak: 0 },
      questsClaimed: [],
      totalFish: 0,
      expedition: { active: false, location: 'trail', enemy: 'woodland boar', hp: 3, maxHp: 3, round: 0, log: '' },
      day: 1,
      lastSaved: Date.now(),
      tutorialDone: false,
      soundOn: false,
      theme: 'meadow'
    };
  }

  function itemLabel(id) {
    const labels = {
      tea: 'Soothing tea', bait: 'Wildflower bait', maps: 'Hand-drawn maps',
      minnows: 'Minnows', perch: 'Perch', trout: 'Trout',
      glimmerfish: 'Glimmerfish', oldBoots: 'Old boots'
    };
    return labels[id] || id;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { state: defaultState(), offlineSeconds: 0, newSave: true };
      const parsed = JSON.parse(raw);
      const initial = defaultState();
      const savedRoster = Array.isArray(parsed.guild?.roster) ? parsed.guild.roster : [];
      const roster = savedRoster.filter((hero) => hero && typeof hero === 'object').map((hero, index) => ({
        id: typeof hero.id === 'string' ? hero.id.slice(0, 40) : `hero-${index}`,
        name: typeof hero.name === 'string' ? hero.name.slice(0, 24) : `Traveler ${index + 1}`,
        role: ['idle', 'forager', 'angler', 'guardian'].includes(hero.role) ? hero.role : 'idle',
        level: Math.max(1, number(hero.level)),
        xp: number(hero.xp),
        avatar: typeof hero.avatar === 'string' ? hero.avatar.slice(0, 2) : ''
      }));
      const savedHistory = Array.isArray(parsed.sea?.history)
        ? parsed.sea.history.filter((entry) => typeof entry === 'string').slice(0, 10).map((entry) => entry.slice(0, 240))
        : [];
      const savedStars = Array.isArray(parsed.astral?.unlocked)
        ? parsed.astral.unlocked.filter((id) => CONSTELLATIONS.some((star) => star.id === id))
        : [];
      const state = {
        ...initial,
        ...parsed,
        resources: Object.fromEntries(Object.keys(initial.resources).map((key) => [key, number(parsed.resources?.[key] ?? initial.resources[key])])),
        buildings: Object.fromEntries(Object.keys(initial.buildings).map((key) => [key, number(parsed.buildings?.[key] ?? initial.buildings[key])])),
        stats: {
          ...initial.stats,
          ...(parsed.stats || {}),
          gathered: Object.fromEntries(Object.keys(initial.stats.gathered).map((key) => [key, number(parsed.stats?.gathered?.[key] ?? initial.stats.gathered[key])])),
          locationTrips: Object.fromEntries(Object.keys(initial.stats.locationTrips).map((key) => [key, number(parsed.stats?.locationTrips?.[key] ?? initial.stats.locationTrips[key])]))
        },
        productionRemainder: Object.fromEntries(Object.keys(initial.productionRemainder).map((key) => [key, Math.max(0, Math.min(0.999999, Number(parsed.productionRemainder?.[key]) || 0))])),
        guild: { roster: roster.length ? roster : initial.guild.roster },
        sea: {
          ...initial.sea,
          harborLevel: Math.min(3, number(parsed.sea?.harborLevel)),
          voyageFinishAt: Math.max(0, Number.isFinite(Number(parsed.sea?.voyageFinishAt)) ? Number(parsed.sea?.voyageFinishAt) : 0),
          voyages: number(parsed.sea?.voyages),
          history: savedHistory
        },
        astral: { ...initial.astral, cycles: number(parsed.astral?.cycles), unlocked: [...new Set(savedStars)] },
        automation: {
          wood: Boolean(parsed.automation?.wood),
          berries: Boolean(parsed.automation?.berries),
          fish: Boolean(parsed.automation?.fish)
        },
        items: Object.fromEntries(Object.keys(initial.items).map((key) => [key, number(parsed.items?.[key] ?? initial.items[key])])),
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter((id) => ACHIEVEMENTS.some((item) => item.id === id)) : [],
        daily: { lastClaimedOn: typeof parsed.daily?.lastClaimedOn === 'string' ? parsed.daily.lastClaimedOn : '', streak: number(parsed.daily?.streak) },
        questsClaimed: Array.isArray(parsed.questsClaimed) ? parsed.questsClaimed.filter((id) => QUESTS.some((quest) => quest.id === id)) : [],
        expedition: {
          ...initial.expedition,
          active: Boolean(parsed.expedition?.active),
          location: LOCATIONS.some((location) => location.name === parsed.expedition?.location) ? parsed.expedition.location : initial.expedition.location,
          enemy: 'woodland boar',
          hp: Math.max(1, number(parsed.expedition?.hp) || initial.expedition.hp),
          maxHp: Math.max(1, number(parsed.expedition?.maxHp) || initial.expedition.maxHp),
          round: number(parsed.expedition?.round),
          log: typeof parsed.expedition?.log === 'string' ? parsed.expedition.log.slice(0, 240) : ''
        },
        totalFish: number(parsed.totalFish),
        day: Math.max(1, number(parsed.day) || 1),
        tutorialDone: parsed.tutorialDone === undefined ? true : Boolean(parsed.tutorialDone),
        soundOn: Boolean(parsed.soundOn),
        theme: parsed.theme === 'moonlit' ? 'moonlit' : 'meadow'
      };
      for (const resource of Object.keys(state.resources)) state.resources[resource] = number(state.resources[resource]);
      for (const building of Object.keys(state.buildings)) state.buildings[building] = number(state.buildings[building]);
      for (const resource of Object.keys(state.items)) state.items[resource] = number(state.items[resource]);
      for (const resource of Object.keys(state.stats.gathered)) state.stats.gathered[resource] = number(state.stats.gathered[resource]);
      for (const location of Object.keys(state.stats.locationTrips)) state.stats.locationTrips[location] = number(state.stats.locationTrips[location]);
      for (const key of ['upgrades', 'fishCaught', 'boarsDefeated', 'visits', 'fishStreak', 'expeditions', 'stardustFound', 'bluffFinds']) {
        state.stats[key] = number(state.stats[key]);
      }
      for (const resource of Object.keys(state.productionRemainder)) {
        state.productionRemainder[resource] = Math.max(0, Math.min(0.999999, Number(state.productionRemainder[resource]) || 0));
      }
      const savedAt = Number(parsed.lastSaved);
      const elapsed = Math.max(0, Math.floor((Date.now() - (Number.isFinite(savedAt) && savedAt > 0 ? savedAt : Date.now())) / 1000));
      const offlineSeconds = Math.min(OFFLINE_CAP_SECONDS, elapsed);
      addProduction(state, offlineSeconds);
      state.day += Math.floor(offlineSeconds / (60 * 60));
      completeVoyage(state, false);
      state.lastSaved = Date.now();
      return { state, offlineSeconds };
    } catch (error) {
      console.error('Could not read the village save.', error);
      return { state: defaultState(), offlineSeconds: 0, corrupted: true };
    }
  }

  function addProduction(target, seconds) {
    const starBonus = target.astral.unlocked.includes('hearth') ? 1.2 : 1;
    const heroCount = (role, resource) => target.automation[resource]
      ? target.guild.roster.filter((hero) => hero.role === role).reduce((total, hero) => total + Math.max(1, hero.level), 0)
      : 0;
    const rates = {
      wood: target.buildings.lumbermill / 20 + heroCount('forager', 'wood') / 60,
      berries: target.buildings.garden / 30 + heroCount('forager', 'berries') / 90,
      fish: target.sea.harborLevel && target.automation.fish ? heroCount('angler', 'fish') / 90 : 0
    };
    for (const [resource, rate] of Object.entries(rates)) {
      if (!rate) continue;
      const earned = target.productionRemainder[resource] + seconds * rate * starBonus;
      target.resources[resource] += Math.floor(earned);
      target.productionRemainder[resource] = earned % 1;
    }
  }

  let { state, offlineSeconds, corrupted, newSave } = loadState();
  let toastTimer;
  let castCooldown = false;
  let audioContext;
  let toastQueue = [];

  function save() {
    checkAchievements();
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

  function checkAchievements() {
    let earned = false;
    for (const achievement of ACHIEVEMENTS) {
      if (state.achievements.includes(achievement.id) || !achievement.test(state)) continue;
      state.achievements.push(achievement.id);
      addResources(achievement.reward);
      toast(`Milestone: ${achievement.title}`);
      earned = true;
    }
    if (earned) {
      renderResources();
      renderInventory();
      renderQuests();
      renderBuildings();
    }
  }

  function sound() {
    if (!state.soundOn) return;
    try {
      audioContext ||= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.14);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.14);
    } catch (error) {
      console.warn('Village sound is unavailable in this browser.', error);
    }
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
      else if (Object.hasOwn(state.items, resource)) state.items[resource] += amount;
    }
  }

  function giveXp(amount, role) {
    let remaining = amount;
    const candidates = role
      ? state.guild.roster.filter((hero) => hero.role === role)
      : state.guild.roster.filter((hero) => hero.role !== 'idle');
    for (const hero of candidates) {
      if (!remaining) break;
      hero.xp += remaining;
      while (hero.xp >= hero.level * 10) {
        hero.xp -= hero.level * 10;
        hero.level += 1;
        toast(`${hero.name} reached level ${hero.level}!`);
      }
      remaining = 0;
    }
  }

  function costText(cost) {
    return Object.entries(cost).map(([resource, amount]) => `${RESOURCE_LABELS[resource]?.icon || '✦'} ${amount}`).join('  ');
  }

  function questProgress(quest) {
    if (quest.type === 'gathered') return state.stats.gathered[quest.resource];
    if (quest.type === 'guildSize') return state.guild.roster.length;
    if (quest.type === 'buildingLevels') return Object.values(state.buildings).reduce((total, level) => total + level, 0);
    if (quest.type === 'stardustFound') return state.stats.stardustFound;
    return state.stats[quest.type] || 0;
  }

  function isQuestComplete(quest) {
    return questProgress(quest) >= quest.target;
  }

  function renderResources() {
    for (const resource of Object.keys(RESOURCE_LABELS)) {
      const element = $(`#${resource}-count`);
      if (element) element.textContent = state.resources[resource].toLocaleString();
    }
    $('#day-count').textContent = state.day;
    $('#scene-day').textContent = state.day;
    $('#fish-total').textContent = state.totalFish;
    $('#fish-streak').textContent = `${state.stats.fishStreak} ${state.stats.fishStreak === 1 ? 'catch' : 'catches'}`;
    $('#sound-toggle').classList.toggle('is-muted', !state.soundOn);
    $('#sound-toggle').setAttribute('aria-label', state.soundOn ? 'Sound on' : 'Sound off');
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
    $('#achievement-count').textContent = `${state.achievements.length} / ${ACHIEVEMENTS.length} discovered`;
    $('#achievement-list').innerHTML = ACHIEVEMENTS.map((achievement) => {
      const complete = state.achievements.includes(achievement.id);
      const reward = Object.entries(achievement.reward).map(([resource, amount]) => `${RESOURCE_LABELS[resource]?.icon || '✦'} ${amount} ${RESOURCE_LABELS[resource]?.label || resource}`).join(' · ');
      return `<article class="achievement-card ${complete ? 'is-earned' : ''}"><span class="achievement-icon">${achievement.icon}</span><div><h3>${achievement.title}</h3><p>${achievement.description}</p></div><span class="achievement-reward">${complete ? '✓ Earned' : reward}</span></article>`;
    }).join('');
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function renderDailyReward() {
    const today = localDateKey(new Date());
    const claimed = state.daily.lastClaimedOn === today;
    const nextDay = (state.daily.streak % DAILY_REWARDS.length) + 1;
    const reward = DAILY_REWARDS[nextDay - 1];
    $('#daily-title').textContent = claimed ? 'Your gift is already on its way' : `Day ${nextDay} gift from the valley`;
    $('#daily-description').textContent = claimed
      ? 'Come back tomorrow for another small bundle of helpful supplies.'
      : Object.entries(reward).map(([resource, amount]) => `+${amount} ${RESOURCE_LABELS[resource].label.toLowerCase()}`).join(' · ');
    $('#daily-streak').textContent = `Your streak: ${state.daily.streak} ${state.daily.streak === 1 ? 'day' : 'days'}`;
    $('#claim-daily').disabled = claimed;
    $('#claim-daily').textContent = claimed ? 'Come back tomorrow' : 'Open today’s gift';
  }

  function renderInventory() {
    const resources = Object.entries(RESOURCE_LABELS).map(([resource, info]) =>
      `<div class="inventory-item">${info.icon} ${info.label}<strong>${state.resources[resource]}</strong></div>`);
    const items = Object.entries(state.items).map(([item, amount]) =>
      `<div class="inventory-item">✿ ${itemLabel(item)}<strong>${amount}</strong></div>`);
    $('#inventory-details').innerHTML = [...resources, ...items].join('');
  }

  function renderExpedition() {
    const panel = $('#expedition-panel');
    const card = $('#combat-card');
    if (state.expedition.active) {
      panel.classList.add('hidden');
      card.classList.remove('hidden');
      const hp = Math.max(0, state.expedition.hp);
      const progress = Math.max(0, hp / state.expedition.maxHp * 100);
      card.innerHTML = `<div class="combat-top"><div><p class="eyebrow">A LITTLE ENCOUNTER · ${escapeHtml(state.expedition.location)}</p><h3>A wild ${escapeHtml(state.expedition.enemy)}</h3><p>Choose an action or let your companions help. A little kindness can go a long way.</p></div><span class="quest-icon">🐗</span></div><div class="progress-label"><span>${state.expedition.enemy === 'woodland boar' ? 'Boar’s patience' : 'Adventurer stamina'}</span><strong>${hp} / ${state.expedition.maxHp}</strong></div><div class="health-track"><div class="health-fill" style="width:${progress}%"></div></div><div class="combat-actions"><button class="primary-button" data-combat="toss" type="button" ${state.resources.berries < 1 ? 'disabled' : ''}>Offer a berry <span>♥</span></button><button class="upgrade-button" data-combat="map" type="button" ${state.items.maps < 1 ? 'disabled' : ''}>Use hand-drawn map (${state.items.maps})</button><button class="upgrade-button" data-combat="tea" type="button" ${state.items.tea < 1 ? 'disabled' : ''}>Sip tea (${state.items.tea})</button><button class="upgrade-button" data-combat="leave" type="button">Head back</button></div><p class="combat-log" aria-live="polite">${escapeHtml(state.expedition.log || BOAR_LINES[0])}</p>`;
    } else {
      card.classList.add('hidden');
      panel.classList.remove('hidden');
      if (state.stats.boarsDefeated) {
        panel.innerHTML = '<span class="panel-emoji">🌼</span><div><h3>The boar’s a friend now</h3><p>It left a few things by the trail. Maybe you’ll meet another neighbor next time.</p></div><span class="trail-badge">FRIENDS</span>';
      }
    }
    $('#start-explore').disabled = state.expedition.active || state.resources.berries < 1;
  }

  function renderLocations() {
    $('#location-list').innerHTML = LOCATIONS.map((location) => {
      const unlocked = location.requirement(state);
      const trips = state.stats.locationTrips[location.id] || 0;
      return `<article class="location-card ${unlocked ? '' : 'is-locked'}"><div class="location-icon">${unlocked ? location.icon : '🔒'}</div><div class="location-copy"><h3>${location.name}</h3><p>${unlocked ? location.description : location.unlockText || 'Discover more of the valley to unlock this place.'}</p><span>${trips ? `${trips} ${trips === 1 ? 'visit' : 'visits'}` : unlocked ? 'Ready to explore' : 'Not discovered'}</span></div><button class="upgrade-button" data-location="${location.id}" type="button" ${!unlocked || state.expedition.active || !canAfford(location.cost) ? 'disabled' : ''}>${unlocked ? `Go · ${costText(location.cost)}` : 'Locked'}</button></article>`;
    }).join('');
  }

  function renderAdventurers() {
    $('#guild-summary').textContent = `${state.guild.roster.length} adventurer${state.guild.roster.length === 1 ? '' : 's'} ready to help`;
    const level = Math.max(...state.guild.roster.map((hero) => hero.level));
    $('#guild-level').textContent = `Guild ${Math.max(1, level)}`;
    $('#adventurer-list').innerHTML = state.guild.roster.map((hero) => {
      const nextXp = hero.level * 10;
      const roleOptions = [['idle', 'Resting'], ['forager', 'Forager'], ['angler', 'Angler'], ['guardian', 'Guardian']];
      return `<article class="adventurer-card"><div class="adventurer-avatar">${escapeHtml(hero.avatar || hero.name[0])}</div><div class="adventurer-info"><h3>${escapeHtml(hero.name)}</h3><p>Level ${hero.level} · ${hero.xp} / ${nextXp} experience</p><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, hero.xp / nextXp * 100)}%"></div></div></div><label class="role-select-label">ASSIGNMENT<select data-role="${escapeHtml(hero.id)}">${roleOptions.map(([value, label]) => `<option value="${value}" ${hero.role === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></article>`;
    }).join('');
    $('#recruit-adventurer').disabled = !canAfford({ coins: 15, berries: 5 }) || state.guild.roster.length >= 8;
  }

  function renderHarbor() {
    const level = state.sea.harborLevel;
    const rank = ['An old, quiet dock', 'Willowmere Harbor', 'The bustling harbor', 'The shining seaport'][Math.min(level, 3)];
    $('#harbor-rank').textContent = `${rank} · Rank ${level}`;
    $('#harbor-description').textContent = level ? `Your dock is open for business. Voyages take ${Math.max(15, 60 - level * 10)} seconds.` : 'A few repairs would make this a fine place to set sail.';
    const cost = harborCost(level);
    $('#upgrade-harbor').textContent = level ? `Upgrade harbor · ${costText(cost)}` : `Repair the dock · ${costText(cost)}`;
    $('#upgrade-harbor').disabled = level >= 3 || !canAfford(cost);
    $('#harbor-fish').textContent = state.resources.fish;
    $('#sell-fish').disabled = state.resources.fish < 2;
    const sailing = state.sea.voyageFinishAt > Date.now();
    $('#voyage-status').textContent = sailing ? `Returning in ${Math.ceil((state.sea.voyageFinishAt - Date.now()) / 1000)} sec` : `${state.sea.voyages} voyage${state.sea.voyages === 1 ? '' : 's'} completed`;
    $('#voyage-description').textContent = level
      ? `Send 3 fish and a crew member. The trip takes ${Math.max(15, 60 - level * 10)} seconds.`
      : 'Repair the dock first, then provision 3 fish for a sea voyage.';
    $('#send-voyage').disabled = !level || state.resources.fish < 3 || sailing;
    $('#send-voyage').textContent = sailing ? 'At sea…' : 'Set sail';
    $('#voyage-history').innerHTML = state.sea.history.length
      ? state.sea.history.slice(0, 5).map((entry) => `<p>⛵ ${escapeHtml(entry)}</p>`).join('')
      : '<p>Your first voyage is waiting to be written.</p>';
  }

  function harborCost(level) {
    return { wood: 12 * (level + 1), stone: 6 * (level + 1), ...(level ? { coins: 8 * level } : {}) };
  }

  function renderAstral() {
    $('#astral-dust').textContent = state.resources.stardust;
    $('#astral-title-summary').textContent = state.astral.cycles
      ? `Cycle ${state.astral.cycles + 1} · ${state.astral.unlocked.length} constellations awake`
      : `${state.astral.unlocked.length} of ${CONSTELLATIONS.length} constellations awake`;
    $('#constellation-list').innerHTML = CONSTELLATIONS.map((star) => {
      const awake = state.astral.unlocked.includes(star.id);
      const cost = Math.max(0, star.cost - (state.buildings.observatory ? 1 : 0));
      return `<article class="constellation-card ${awake ? 'is-awake' : ''}"><span class="constellation-icon">${star.icon}</span><p class="eyebrow">${awake ? 'CONSTELLATION AWAKE' : 'A DISTANT CONSTELLATION'}</p><h3>${star.name}</h3><p>${star.description}</p><span class="constellation-bonus">${star.bonus}</span><button class="upgrade-button" type="button" data-constellation="${star.id}" ${awake || state.resources.stardust < cost ? 'disabled' : ''}>${awake ? 'Awake ✓' : `Plant · ✧ ${cost}`}</button></article>`;
    }).join('');
    const ready = CONSTELLATIONS.every((star) => state.astral.unlocked.includes(star.id));
    $('#astral-reset').disabled = !ready;
  }

  function renderAutomation() {
    const workers = {
      wood: state.guild.roster.filter((hero) => hero.role === 'forager').length,
      berries: state.guild.roster.filter((hero) => hero.role === 'forager').length,
      fish: state.guild.roster.filter((hero) => hero.role === 'angler').length
    };
    const tasks = [
      { id: 'wood', title: 'Gather wood', icon: '♧', description: 'Foragers bring a little wood home every minute.', role: 'forager', rate: '1 wood / 60 sec per level' },
      { id: 'berries', title: 'Pick berries', icon: '●', description: 'Foragers gather berries whenever the basket is empty.', role: 'forager', rate: '1 berry / 90 sec per level' },
      { id: 'fish', title: 'Tend the nets', icon: '≈', description: 'Anglers bring back fish from your repaired harbor.', role: 'angler', rate: '1 fish / 90 sec per level' }
    ];
    $('#automation-summary').textContent = Object.values(state.automation).some(Boolean)
      ? `${Object.values(state.automation).filter(Boolean).length} village task${Object.values(state.automation).filter(Boolean).length === 1 ? '' : 's'} running`
      : 'Everything is being managed by hand';
    $('#automation-list').innerHTML = tasks.map((task) => {
      const count = workers[task.id];
      return `<article class="automation-card ${count ? '' : 'is-unavailable'}"><span class="automation-icon">${task.icon}</span><div><h3>${task.title}</h3><p>${count ? `${count} assigned ${task.role}${count > 1 ? 's' : ''} · ${task.rate}` : `Assign a ${task.role} in the guild to unlock.`}</p></div><label class="switch"><input type="checkbox" data-automation="${task.id}" ${state.automation[task.id] ? 'checked' : ''} ${!count || (task.id === 'fish' && !state.sea.harborLevel) ? 'disabled' : ''}><span class="switch-slider"></span><span class="sr-only">Automate ${task.title}</span></label></article>`;
    }).join('');
    $('#recipe-list').innerHTML = RECIPES.map((recipe) => {
      const available = state.buildings.workshop > 0;
      return `<div class="recipe-row"><span class="recipe-icon">${recipe.icon}</span><div><strong>${recipe.name}</strong><p>${available ? recipe.description : 'Build a little workshop to unlock recipes.'}</p><small>${costText(recipe.cost)} → ${Object.values(recipe.output)[0]} ${Object.keys(recipe.output)[0]}</small></div><button class="upgrade-button" type="button" data-recipe="${recipe.id}" ${!available || !canAfford(recipe.cost) ? 'disabled' : ''}>Craft</button></div>`;
    }).join('');
  }

  function renderTheme() {
    const moonlit = state.theme === 'moonlit';
    document.body.classList.toggle('moonlit', moonlit);
    $('#theme-toggle').textContent = moonlit ? 'Return to daylight' : 'Switch to moonlight';
  }

  function completeVoyage(target, notify) {
    if (!target.sea.voyageFinishAt || target.sea.voyageFinishAt > Date.now()) return false;
    const bonus = target.astral.unlocked.includes('tide') ? 1.25 : 1;
    const shells = Math.max(1, Math.floor((1 + target.sea.harborLevel) * bonus));
    const coins = Math.floor((8 + target.sea.harborLevel * 4) * bonus);
    target.resources.shells += shells;
    target.resources.coins += coins;
    target.resources.stardust += 1;
    target.stats.stardustFound += 1;
    target.sea.voyages += 1;
    target.sea.voyageFinishAt = 0;
    target.sea.history.unshift(`Voyage ${target.sea.voyages}: brought back ${shells} shell${shells === 1 ? '' : 's'}, ${coins} coins, and a pinch of stardust.`);
    target.sea.history = target.sea.history.slice(0, 10);
    if (notify) {
      giveXp(3, 'angler');
      toast('Your sea voyage has returned with treasure!');
    }
    return true;
  }

  function renderAll() {
    renderResources();
    renderBuildings();
    renderHomeQuest();
    renderQuests();
    renderDailyReward();
    renderInventory();
    renderExpedition();
    renderLocations();
    renderAdventurers();
    renderHarbor();
    renderAstral();
    renderAutomation();
    renderTheme();
  }

  function markGathered(resource, amount) {
    state.resources[resource] += amount;
    state.stats.gathered[resource] += amount;
    giveXp(1, 'forager');
    renderAll();
    save();
  }

  function gather(resource) {
    const amount = resource === 'wood' ? 3 : 2;
    markGathered(resource, amount);
    sound();
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
    sound();
    toast(`${building.name} is looking lovely!`);
  }

  function navigate(view) {
    if (!$(`#view-${view}`)) return;
    document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startExpedition() {
    exploreLocation('trail');
  }

  function exploreLocation(locationId) {
    if (state.expedition.active) return;
    const location = LOCATIONS.find((item) => item.id === locationId);
    if (!location || !location.requirement(state)) {
      toast('This path has not opened yet. Keep exploring the valley.');
      return;
    }
    if (!spend(location.cost)) {
      toast('Bring one berry for the walk. The meadow is just outside!');
      return;
    }
    state.stats.expeditions += 1;
    state.stats.visits += 1;
    state.stats.locationTrips[location.id] = (state.stats.locationTrips[location.id] || 0) + 1;
    if (location.kind === 'combat') {
      const party = state.guild.roster.find((hero) => hero.role === 'guardian') || state.guild.roster[0];
      const hp = Math.max(2, 4 - (party ? Math.floor(party.level / 2) : 0));
      state.expedition = { active: true, location: location.name, enemy: 'woodland boar', hp, maxHp: hp, round: 0, log: BOAR_LINES[0] };
      giveXp(1);
    } else {
      const bonus = state.astral.unlocked.includes('compass') ? 1.2 : 1;
      const find = (amount) => Math.max(1, Math.floor(amount * bonus));
      let note = '';
      if (location.kind === 'grove') {
        addResources({ berries: find(4), petals: find(2) });
        note = 'The Sunlit Grove is full of ripe berries and wildflowers.';
        giveXp(2, 'forager');
      } else if (location.kind === 'quarry') {
        addResources({ stone: find(5), iron: 1 });
        note = 'You found a quiet ledge rich in stone and iron.';
        giveXp(2, 'guardian');
      } else if (location.kind === 'shore') {
        addResources({ shells: find(2), fish: 1 });
        note = 'The tide left bright shells and a fish in the shallows.';
        giveXp(2, 'angler');
      } else if (location.kind === 'bluff') {
        addResources({ stardust: 1, petals: 2 });
        state.stats.stardustFound += 1;
        state.stats.bluffFinds += 1;
        note = 'A little stardust glimmers in the grass.';
        giveXp(2);
      }
      state.expedition.log = note;
    }
    renderAll();
    save();
    sound();
    toast(`You explored ${location.name}.`);
  }

  function resolveCombat() {
    const location = state.expedition.location;
    const bonus = state.astral.unlocked.includes('compass') ? 1.2 : 1;
    const rewards = {
      wood: Math.floor(4 * bonus),
      stone: Math.floor(2 * bonus),
      petals: Math.floor(2 * bonus),
      stardust: 1
    };
    addResources(rewards);
    state.stats.boarsDefeated += 1;
    state.stats.stardustFound += 1;
    giveXp(4);
    state.sea.history.unshift(`At ${location}, you and the boar became friends. It left ${rewards.wood} wood, ${rewards.stone} stone, and a pinch of stardust.`);
    state.sea.history = state.sea.history.slice(0, 10);
    state.expedition = defaultState().expedition;
    renderAll();
    save();
    toast('A new friend — and a few things for the road!');
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
    if (action === 'tea') {
      craftAndUseTea();
      return;
    }
    if (action === 'map') {
      if (state.items.maps < 1) return;
      state.items.maps -= 1;
      state.expedition.hp -= 2;
      state.expedition.log = 'Your little map shows a peaceful way around the brambles.';
    } else {
      if (state.resources.berries < 1) {
        state.expedition.log = 'You’ve run out of berries to share. Head home and gather a few more.';
        renderExpedition();
        return;
      }
      state.resources.berries -= 1;
      const guardian = state.guild.roster.filter((hero) => hero.role === 'guardian').reduce((total, hero) => total + Math.floor(hero.level / 2), 0);
      state.expedition.hp -= 1 + guardian;
      state.expedition.round += 1;
      state.expedition.log = BOAR_LINES[Math.min(state.expedition.round, BOAR_LINES.length - 1)];
      giveXp(1, 'guardian');
    }
    if (state.expedition.hp <= 0) {
      resolveCombat();
      return;
    }
    renderAll();
    save();
  }

  function recruitAdventurer() {
    if (state.guild.roster.length >= 8 || !spend({ coins: 15, berries: 5 })) {
      toast('The guild needs 15 coins and 5 berries for a new member.');
      return;
    }
    const names = ['Tansy', 'Bramble', 'Pip', 'Juniper', 'Clover', 'Rowan', 'Fern'];
    const name = names.find((candidate) => !state.guild.roster.some((hero) => hero.name === candidate)) || `Traveler ${state.guild.roster.length + 1}`;
    state.guild.roster.push({ id: `hero-${Date.now()}`, name, role: 'idle', level: 1, xp: 0, avatar: name[0] });
    renderAll();
    save();
    toast(`${name} joined your guild!`);
    sound();
  }

  function upgradeHarbor() {
    const level = state.sea.harborLevel;
    const cost = harborCost(level);
    if (level >= 3 || !spend(cost)) {
      toast('The harbor needs more building supplies.');
      return;
    }
    state.sea.harborLevel += 1;
    renderAll();
    save();
    toast(level ? 'The harbor is growing!' : 'The old dock is ready for its first boat!');
  }

  function sellFish() {
    const amount = Math.floor(state.resources.fish / 2) * 2;
    if (!amount) {
      toast('Catch at least two fish before visiting the market stall.');
      return;
    }
    state.resources.fish -= amount;
    state.resources.coins += amount / 2 * 5;
    renderAll();
    save();
    toast(`Traded ${amount} fish for ${amount / 2 * 5} coins.`);
  }

  function sendVoyage() {
    if (!state.sea.harborLevel || state.sea.voyageFinishAt > Date.now() || !spend({ fish: 3 })) {
      toast('A sea voyage needs a repaired harbor and 3 fish for provisions.');
      return;
    }
    const duration = Math.max(15, 60 - state.sea.harborLevel * 10);
    state.sea.voyageFinishAt = Date.now() + duration * 1000;
    renderAll();
    save();
    toast(`The boat will be back in about ${duration} seconds.`);
  }

  function awakenConstellation(id) {
    const constellation = CONSTELLATIONS.find((star) => star.id === id);
    if (!constellation || state.astral.unlocked.includes(id)) return;
    const cost = Math.max(0, constellation.cost - (state.buildings.observatory ? 1 : 0));
    if (!spend({ stardust: cost })) {
      toast(`Find ${cost} stardust on the map or at sea first.`);
      return;
    }
    state.astral.unlocked.push(id);
    state.astral.unlocked = [...new Set(state.astral.unlocked)];
    renderAll();
    save();
    toast(`${constellation.name} is shining over your village.`);
    sound();
  }

  function beginNewCycle() {
    if (!CONSTELLATIONS.every((star) => state.astral.unlocked.includes(star.id))) return;
    if (!window.confirm('Start a new cycle? Your discoveries and constellations stay, while buildings and supplies reset.')) return;
    const persistent = {
      guild: state.guild,
      stats: state.stats,
      achievements: state.achievements,
      questsClaimed: state.questsClaimed,
      astral: { unlocked: state.astral.unlocked, cycles: state.astral.cycles + 1 },
      sea: { ...defaultState().sea, voyages: state.sea.voyages, history: state.sea.history },
      daily: state.daily,
      tutorialDone: true,
      soundOn: state.soundOn,
      theme: state.theme,
      day: state.day + 1
    };
    state = { ...defaultState(), ...persistent };
    state.guild.roster.forEach((hero) => { if (hero.role === 'angler') hero.role = 'forager'; });
    renderAll();
    save();
    toast('A brighter new cycle begins beneath familiar stars.');
    navigate('village');
  }

  function craft(recipeId) {
    const recipe = RECIPES.find((item) => item.id === recipeId);
    if (!recipe || !state.buildings.workshop || !spend(recipe.cost)) {
      toast('Gather the recipe supplies and build a workshop first.');
      return;
    }
    addResources(recipe.output);
    renderAll();
    save();
    toast(`Crafted ${recipe.name}.`);
    sound();
  }

  function setRole(heroId, role) {
    const hero = state.guild.roster.find((member) => member.id === heroId);
    if (!hero || !['idle', 'forager', 'angler', 'guardian'].includes(role)) return;
    hero.role = role;
    if (!state.guild.roster.some((member) => member.role === 'forager')) {
      state.automation.wood = false;
      state.automation.berries = false;
    }
    if (!state.guild.roster.some((member) => member.role === 'angler')) state.automation.fish = false;
    renderAll();
    save();
    toast(`${hero.name} is now ${role === 'idle' ? 'resting' : `a ${role}`}.`);
  }

  function setAutomation(task, enabled) {
    if (!Object.hasOwn(state.automation, task)) return;
    const role = task === 'fish' ? 'angler' : 'forager';
    const hasWorker = state.guild.roster.some((hero) => hero.role === role);
    if (!hasWorker || (task === 'fish' && !state.sea.harborLevel)) {
      toast(task === 'fish' ? 'Repair the harbor and assign an angler first.' : 'Assign a forager in the guild first.');
      renderAll();
      return;
    }
    state.automation[task] = enabled;
    renderAll();
    save();
    toast(enabled ? `${task === 'fish' ? 'Fishing nets' : `${task} gathering`} will be managed automatically.` : 'Automatic task paused.');
  }

  function craftAndUseTea() {
    if (state.items.tea < 1 || !state.expedition.active) return;
    state.items.tea -= 1;
    state.expedition.hp -= 1;
    state.expedition.log = 'A soothing tea calms the boar and helps your party regain its courage.';
    if (state.expedition.hp <= 0) {
      resolveCombat();
      return;
    }
    renderAll();
    save();
  }

  function recordCatch() {
    const rareBonus = state.astral.unlocked.includes('tide') ? 0.15 : 0;
    const baited = state.items.bait > 0;
    if (baited) state.items.bait -= 1;
    const rareChance = 0.08 + rareBonus + (baited ? 0.25 : 0) + state.sea.harborLevel * 0.04;
    const rareRoll = Math.random();
    let fishName;
    let item;
    if (rareRoll < rareChance) {
      fishName = 'a moonlit glimmerfish';
      item = 'glimmerfish';
      state.resources.stardust += 1;
      state.stats.stardustFound += 1;
    } else {
      const common = [
        ['a silvery minnow', 'minnows'],
        ['a little lake perch', 'perch'],
        ['a stripey sunfish', 'perch'],
        ['a speckled trout', 'trout'],
        ['an old boot (well, almost)', 'oldBoots']
      ];
      const [name, id] = common[Math.floor(Math.random() * common.length)];
      fishName = name;
      item = id;
    }
    state.resources.fish += 1;
    state.items[item] += 1;
    state.totalFish += 1;
    state.stats.fishCaught += 1;
    state.stats.fishStreak += 1;
    return fishName;
  }
  function fish() {
    if (castCooldown) return;
    castCooldown = true;
    $('#cast-line').disabled = true;
    const fishName = recordCatch();
    giveXp(1, 'angler');
    $('#fishing-result').textContent = `You caught ${fishName}! What a lovely surprise.`;
    renderAll();
    save();
    toast('A little fish for your pockets!');
    sound();
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

  function claimDailyReward() {
    const today = localDateKey(new Date());
    if (state.daily.lastClaimedOn === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    state.daily.streak = state.daily.lastClaimedOn === localDateKey(yesterday) ? state.daily.streak + 1 : 1;
    state.daily.lastClaimedOn = today;
    const reward = DAILY_REWARDS[(state.daily.streak - 1) % DAILY_REWARDS.length];
    addResources(reward);
    renderAll();
    save();
    toast(`Daily gift received: ${Object.entries(reward).map(([resource, amount]) => `+${amount} ${RESOURCE_LABELS[resource].label.toLowerCase()}`).join(' · ')}`);
    sound();
  }

  function restart() {
    if (!window.confirm('Start a new story? Your current village and its saved progress will be cleared.')) return;
    state = defaultState();
    save();
    renderAll();
    navigate('village');
    $('#tutorial').classList.remove('hidden');
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
    const locationButton = event.target.closest('[data-location]');
    if (locationButton) exploreLocation(locationButton.dataset.location);
    const constellationButton = event.target.closest('[data-constellation]');
    if (constellationButton) awakenConstellation(constellationButton.dataset.constellation);
    const recipeButton = event.target.closest('[data-recipe]');
    if (recipeButton) craft(recipeButton.dataset.recipe);
  });

  $('#start-explore').addEventListener('click', startExpedition);
  $('#cast-line').addEventListener('click', fish);
  $('#recruit-adventurer').addEventListener('click', recruitAdventurer);
  $('#reset-game').addEventListener('click', restart);
  $('#restart-link').addEventListener('click', restart);
  $('#upgrade-harbor').addEventListener('click', upgradeHarbor);
  $('#sell-fish').addEventListener('click', sellFish);
  $('#send-voyage').addEventListener('click', sendVoyage);
  $('#astral-reset').addEventListener('click', beginNewCycle);
  $('#claim-daily').addEventListener('click', claimDailyReward);
  $('#theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'moonlit' ? 'meadow' : 'moonlit';
    renderTheme();
    save();
    toast(state.theme === 'moonlit' ? 'Moonlit mode is on.' : 'Daylight is back in the valley.');
  });
  $('#finish-tutorial').addEventListener('click', () => {
    state.tutorialDone = true;
    $('#tutorial').classList.add('hidden');
    save();
    sound();
    navigate('village');
  });
  $('#help-button').addEventListener('click', () => $('#tutorial').classList.remove('hidden'));
  $('#sound-toggle').addEventListener('click', (event) => {
    state.soundOn = !state.soundOn;
    renderResources();
    save();
    toast(state.soundOn ? 'Gentle village sounds are on.' : 'Quiet mode is on.');
    sound();
  });
  $('#view-automanage').addEventListener('change', (event) => {
    const control = event.target.closest('[data-automation]');
    if (control) setAutomation(control.dataset.automation, control.checked);
  });
  $('#view-adventurers').addEventListener('change', (event) => {
    const control = event.target.closest('[data-role]');
    if (control) setRole(control.dataset.role, control.value);
  });
  $('#inventory-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    $('#inventory-details').classList.toggle('hidden', expanded);
    button.innerHTML = expanded ? 'Details <span>⌄</span>' : 'Hide <span>⌃</span>';
  });

  setInterval(() => {
    const hasWorkers = Object.values(state.automation).some(Boolean);
    const hasBuildings = state.buildings.garden || state.buildings.lumbermill;
    const returned = completeVoyage(state, true);
    if (!hasWorkers && !hasBuildings && !returned && !state.sea.voyageFinishAt) return;
    addProduction(state, 1);
    renderResources();
    renderInventory();
    renderBuildings();
    renderLocations();
    renderHarbor();
    renderAstral();
    renderAutomation();
    save();
  }, 1000);
  window.addEventListener('beforeunload', save);

  renderAll();
  if (newSave && !state.tutorialDone) $('#tutorial').classList.remove('hidden');
  if (offlineSeconds > 0) {
    const hours = Math.floor(offlineSeconds / 3600);
    const minutes = Math.floor((offlineSeconds % 3600) / 60);
    const duration = hours ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
    setTimeout(() => toast(`Welcome back! Your village grew while you were away (${duration}, up to 8 hours).`), 450);
  } else if (corrupted) {
    setTimeout(() => toast('A fresh journal was started because the old save could not be read.'), 450);
  }
})();
