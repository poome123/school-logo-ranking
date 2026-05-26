/*
  后续新增学校：
  1. 把学校 Logo 图片放进 assets/logos 文件夹；
  2. 在 schools 数组里新增一个对象；
  3. 刷新页面，新学校会自动出现在“待排名区”。

  后续修改档位：
  直接编辑 tiers 数组的 id、name、color。id 一旦上线后尽量不要改，
  因为 localStorage 会用它保存当前档位里的学校。
*/

const tiers = [
  { id: "hang", name: "夯", color: "#f87171" },
  { id: "top", name: "顶级", color: "#fb923c" },
  { id: "elite", name: "人上人", color: "#fde047" },
  { id: "value", name: "性价比", color: "#86efac" },
  { id: "npc", name: "NPC", color: "#93c5fd" },
  { id: "low", name: "拉完了", color: "#e5e7eb" },
];

const schools = [
  {
    id: "bupt",
    shortName: "北邮",
    fullName: "北京邮电大学",
    logo: "assets/logos/bupt.png",
  },
  {
    id: "xidian",
    shortName: "西电",
    fullName: "西安电子科技大学",
    logo: "assets/logos/xidian.png",
  },
  {
    id: "uestc",
    shortName: "电科大",
    fullName: "电子科技大学",
    logo: "assets/logos/uestc.png",
  },
  {
    id: "cqupt",
    shortName: "重邮",
    fullName: "重庆邮电大学",
    logo: "assets/logos/cqupt.png",
  },
  {
    id: "njupt",
    shortName: "南邮",
    fullName: "南京邮电大学",
    logo: "assets/logos/njupt.png",
  },
  {
    id: "hdu",
    shortName: "杭电",
    fullName: "杭州电子科技大学",
    logo: "assets/logos/hdu.png",
  },
  {
    id: "xupt",
    shortName: "西邮",
    fullName: "西安邮电大学",
    logo: "assets/logos/xupt.png",
  },
  {
    id: "guet",
    shortName: "桂电",
    fullName: "桂林电子科技大学",
    logo: "assets/logos/guet.png",
  },
];

const STORAGE_KEY = "ee-school-logo-ranking-v1";

const tierBoard = document.querySelector("#tierBoard");
const poolList = document.querySelector("#poolList");
const resetBtn = document.querySelector("#resetBtn");
const liveBtn = document.querySelector("#liveBtn");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const saveStatus = document.querySelector("#saveStatus");

let sortables = [];
let activeDropList = null;
let isDragging = false;
let saveTimer = null;
let draggedCard = null;

function getDefaultState() {
  return {
    pool: schools.map((school) => school.id),
    tiers: Object.fromEntries(tiers.map((tier) => [tier.id, []])),
  };
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultState());
  } catch {
    return getDefaultState();
  }
}

function normalizeState(rawState) {
  const knownSchoolIds = new Set(schools.map((school) => school.id));
  const seen = new Set();
  const state = {
    pool: [],
    tiers: Object.fromEntries(tiers.map((tier) => [tier.id, []])),
  };

  const addKnownId = (targetList, schoolId) => {
    if (knownSchoolIds.has(schoolId) && !seen.has(schoolId)) {
      targetList.push(schoolId);
      seen.add(schoolId);
    }
  };

  tiers.forEach((tier) => {
    const savedIds = rawState?.tiers?.[tier.id] || [];
    savedIds.forEach((schoolId) => addKnownId(state.tiers[tier.id], schoolId));
  });

  (rawState?.pool || []).forEach((schoolId) => addKnownId(state.pool, schoolId));

  schools.forEach((school) => {
    if (!seen.has(school.id)) {
      state.pool.push(school.id);
    }
  });

  return state;
}

function saveState() {
  const state = {
    pool: getIdsFromList(poolList),
    tiers: Object.fromEntries(
      tiers.map((tier) => [tier.id, getIdsFromList(document.querySelector(`#tier-${tier.id}`))])
    ),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  flashSaveStatus();
}

function getIdsFromList(listElement) {
  return Array.from(listElement.querySelectorAll(".school-card")).map((card) => card.dataset.schoolId);
}

function flashSaveStatus() {
  clearTimeout(saveTimer);
  saveStatus.textContent = "已自动保存";
  saveStatus.classList.add("saved");
  saveTimer = setTimeout(() => {
    saveStatus.textContent = "自动保存已开启";
    saveStatus.classList.remove("saved");
  }, 1200);
}

function render() {
  destroySortables();
  const state = loadState();
  const schoolById = new Map(schools.map((school) => [school.id, school]));

  tierBoard.innerHTML = tiers
    .map(
      (tier) => `
        <section class="tier-row" data-tier-id="${tier.id}">
          <div class="tier-label" style="background: ${tier.color}">${tier.name}</div>
          <div class="school-list" id="tier-${tier.id}" data-zone-id="${tier.id}" aria-label="${tier.name}档位"></div>
        </section>
      `
    )
    .join("");

  tiers.forEach((tier) => {
    const list = document.querySelector(`#tier-${tier.id}`);
    state.tiers[tier.id].forEach((schoolId) => {
      const school = schoolById.get(schoolId);
      if (school) list.appendChild(createSchoolCard(school));
    });
  });

  poolList.innerHTML = "";
  state.pool.forEach((schoolId) => {
    const school = schoolById.get(schoolId);
    if (school) poolList.appendChild(createSchoolCard(school));
  });

  initSortables();
}

function createSchoolCard(school) {
  const card = document.createElement("article");
  card.className = "school-card";
  card.dataset.schoolId = school.id;
  card.title = school.fullName;

  const logoBox = document.createElement("div");
  logoBox.className = "logo-box";

  const img = document.createElement("img");
  img.src = school.logo;
  img.alt = school.fullName;
  img.loading = "lazy";
  img.addEventListener("error", () => {
    card.classList.add("logo-error");
  });

  const fallback = document.createElement("span");
  fallback.className = "logo-fallback";
  fallback.textContent = school.shortName;

  const shortName = document.createElement("div");
  shortName.className = "school-short";
  shortName.textContent = school.shortName;

  logoBox.append(img, fallback);
  card.append(logoBox, shortName);
  return card;
}

function initSortables() {
  const lists = document.querySelectorAll(".school-list");

  if (!window.Sortable) {
    initNativeDragAndDrop(lists);
    saveStatus.textContent = "离线拖拽已开启";
    return;
  }

  sortables = Array.from(lists).map(
    (list) =>
      new Sortable(list, {
        group: "schools",
        animation: 180,
        draggable: ".school-card",
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        dragClass: "sortable-drag",
        emptyInsertThreshold: 36,
        swapThreshold: 0.68,
        onStart: () => {
          isDragging = true;
          document.body.classList.add("dragging");
        },
        onEnd: () => {
          isDragging = false;
          document.body.classList.remove("dragging");
          setActiveDropList(null);
          saveState();
        },
        onAdd: saveState,
        onUpdate: saveState,
      })
  );
}

// CDN 加载失败时使用浏览器原生拖拽，保证本地打开也能基本可用。
function initNativeDragAndDrop(lists) {
  document.querySelectorAll(".school-card").forEach((card) => {
    card.draggable = true;
    card.addEventListener("dragstart", handleNativeDragStart);
    card.addEventListener("dragend", handleNativeDragEnd);
  });

  lists.forEach((list) => {
    list.addEventListener("dragover", handleNativeDragOver);
    list.addEventListener("drop", handleNativeDrop);
    list.addEventListener("dragenter", () => setActiveDropList(list));
    list.addEventListener("dragleave", (event) => {
      if (!list.contains(event.relatedTarget)) setActiveDropList(null);
    });
  });
}

function handleNativeDragStart(event) {
  draggedCard = event.currentTarget;
  isDragging = true;
  document.body.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedCard.dataset.schoolId);
}

function handleNativeDragEnd() {
  draggedCard = null;
  isDragging = false;
  document.body.classList.remove("dragging");
  setActiveDropList(null);
  saveState();
}

function handleNativeDragOver(event) {
  event.preventDefault();
  if (!draggedCard) return;

  const list = event.currentTarget;
  const nextCard = getNativeInsertBeforeCard(list, event.clientX, event.clientY);
  if (nextCard) {
    list.insertBefore(draggedCard, nextCard);
  } else {
    list.appendChild(draggedCard);
  }
}

function handleNativeDrop(event) {
  event.preventDefault();
  saveState();
}

function getNativeInsertBeforeCard(list, pointerX, pointerY) {
  const cards = Array.from(list.querySelectorAll(".school-card:not(.sortable-drag)")).filter(
    (card) => card !== draggedCard
  );

  return cards.find((card) => {
    const rect = card.getBoundingClientRect();
    const isSameRow = pointerY >= rect.top && pointerY <= rect.bottom;
    return isSameRow && pointerX < rect.left + rect.width / 2;
  });
}

function destroySortables() {
  sortables.forEach((sortable) => sortable.destroy());
  sortables = [];
}

function setActiveDropList(list) {
  if (activeDropList === list) return;
  if (activeDropList) activeDropList.classList.remove("is-active-drop");
  activeDropList = list;
  if (activeDropList) activeDropList.classList.add("is-active-drop");
}

function resetRanking() {
  localStorage.removeItem(STORAGE_KEY);
  render();
  saveState();
}

function toggleLiveMode() {
  const enabled = document.body.classList.toggle("live-mode");
  liveBtn.textContent = enabled ? "退出直播模式" : "直播模式";
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
    fullscreenBtn.textContent = "退出全屏";
  } else {
    await document.exitFullscreen?.();
    fullscreenBtn.textContent = "全屏展示";
  }
}

document.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const element = document.elementFromPoint(event.clientX, event.clientY);
  setActiveDropList(element?.closest(".school-list") || null);
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement ? "退出全屏" : "全屏展示";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("live-mode")) {
    document.body.classList.remove("live-mode");
    liveBtn.textContent = "直播模式";
  }
});

resetBtn.addEventListener("click", resetRanking);
liveBtn.addEventListener("click", toggleLiveMode);
fullscreenBtn.addEventListener("click", toggleFullscreen);

render();
