/*
  后续新增学校：
  1. 把学校 Logo 图片放进 assets/logos 文件夹；
  2. 在 schools 数组里新增一个对象；
  3. 刷新页面，新学校会自动出现在“待评价区”。

  后续修改档位：
  直接编辑 levels 数组的 id、name、color。页面会自动生成横向坐标轴。
*/

const levels = [
  { id: "hard", name: "夯", color: "#ff6b6b" },
  { id: "top", name: "顶级", color: "#ff9f1c" },
  { id: "strong", name: "人上人", color: "#ffe45e" },
  { id: "value", name: "性价比", color: "#8ce99a" },
  { id: "npc", name: "NPC", color: "#74c0fc" },
  { id: "low", name: "拉完了", color: "#dee2e6" },
];

const schools = [
  { id: "bupt", shortName: "北邮", fullName: "北京邮电大学", logo: "assets/logos/bupt.png" },
  { id: "xidian", shortName: "西电", fullName: "西安电子科技大学", logo: "assets/logos/xidian.png" },
  { id: "uestc", shortName: "电科大", fullName: "电子科技大学", logo: "assets/logos/uestc.png" },
  { id: "cqupt", shortName: "重邮", fullName: "重庆邮电大学", logo: "assets/logos/cqupt.png" },
  { id: "njupt", shortName: "南邮", fullName: "南京邮电大学", logo: "assets/logos/njupt.png" },
  { id: "hdu", shortName: "杭电", fullName: "杭州电子科技大学", logo: "assets/logos/hdu.png" },
  { id: "xupt", shortName: "西邮", fullName: "西安邮电大学", logo: "assets/logos/xupt.png" },
  { id: "guet", shortName: "桂电", fullName: "桂林电子科技大学", logo: "assets/logos/guet.png" },
  { id: "xjtu", shortName: "西交", fullName: "西安交通大学", logo: "assets/logos/xjtu.png" },
  { id: "bit", shortName: "北理", fullName: "北京理工大学", logo: "assets/logos/bit.png" },
  { id: "seu", shortName: "东南", fullName: "东南大学", logo: "assets/logos/seu.png" },
  { id: "nwpu", shortName: "西工大", fullName: "西北工业大学", logo: "assets/logos/nwpu.png" },
  { id: "scut", shortName: "华工", fullName: "华南理工大学", logo: "assets/logos/scut.png" },
  { id: "scu", shortName: "川大", fullName: "四川大学", logo: "assets/logos/scu.png" },
  { id: "hust", shortName: "华科", fullName: "华中科技大学", logo: "assets/logos/hust.png" },
  { id: "bjtu", shortName: "北交", fullName: "北京交通大学", logo: "assets/logos/bjtu.png" },
  { id: "swjtu", shortName: "西南交", fullName: "西南交通大学", logo: "assets/logos/swjtu.png" },
  { id: "nuaa", shortName: "南航", fullName: "南京航空航天大学", logo: "assets/logos/nuaa.png" },
  { id: "hrbeu", shortName: "哈工程", fullName: "哈尔滨工程大学", logo: "assets/logos/hrbeu.png" },
  { id: "bjut", shortName: "北工大", fullName: "北京工业大学", logo: "assets/logos/bjut.png" },
  { id: "hfut", shortName: "合工大", fullName: "合肥工业大学", logo: "assets/logos/hfut.png" },
  { id: "dlmu", shortName: "大连海事", fullName: "大连海事大学", logo: "assets/logos/dlmu.png" },
  { id: "fzu", shortName: "福大", fullName: "福州大学", logo: "assets/logos/fzu.png" },
  { id: "hhu", shortName: "河海", fullName: "河海大学", logo: "assets/logos/hhu.png" },
  { id: "ouc", shortName: "中国海洋", fullName: "中国海洋大学", logo: "assets/logos/ouc.png" },
  { id: "cqu", shortName: "重大", fullName: "重庆大学", logo: "assets/logos/cqu.png" },
  { id: "whut", shortName: "武理", fullName: "武汉理工大学", logo: "assets/logos/whut.png" },
  { id: "szu", shortName: "深大", fullName: "深圳大学", logo: "assets/logos/szu.png" },
  { id: "ynu", shortName: "云大", fullName: "云南大学", logo: "assets/logos/ynu.png" },
  { id: "ahu", shortName: "安大", fullName: "安徽大学", logo: "assets/logos/ahu.png" },
  { id: "nuist", shortName: "南信大", fullName: "南京信息工程大学", logo: "assets/logos/nuist.png" },
  { id: "nbu", shortName: "宁大", fullName: "宁波大学", logo: "assets/logos/nbu.png" },
  { id: "cuit", shortName: "成信大", fullName: "成都信息工程大学", logo: "assets/logos/cuit.png" },
];

const STORAGE_KEY = "ee-school-logo-precision-ranking-v2";
const LEGACY_STORAGE_KEY = "ee-school-logo-ranking-v1";
const EDGE_PADDING = 12;

const axisLabels = document.querySelector("#axisLabels");
const rankSurface = document.querySelector("#rankSurface");
const poolList = document.querySelector("#poolList");
const resetBtn = document.querySelector("#resetBtn");
const arrangeBtn = document.querySelector("#arrangeBtn");
const exportBtn = document.querySelector("#exportBtn");
const liveBtn = document.querySelector("#liveBtn");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const saveStatus = document.querySelector("#saveStatus");
const exportDialog = document.querySelector("#exportDialog");
const exportText = document.querySelector("#exportText");
const copyExportBtn = document.querySelector("#copyExportBtn");

const schoolById = new Map(schools.map((school) => [school.id, school]));

let currentState = getDefaultState();
let draggedCard = null;
let dragOrigin = null;
let dragPointerOffset = { x: 0, y: 0 };
let saveTimer = null;
let resizeTimer = null;

function getDefaultState() {
  return {
    pool: schools.map((school) => school.id),
    placed: {},
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return normalizeState(saved);
  } catch {
    // 读取失败时回到默认状态。
  }

  return migrateLegacyState();
}

function migrateLegacyState() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (!legacy) return getDefaultState();

    const migrated = getDefaultState();
    const legacyTierIds = ["hang", "top", "elite", "value", "npc", "low"];
    const idsFromTiers = legacyTierIds.flatMap((tierId) => legacy?.tiers?.[tierId] || []);
    const rankedIds = idsFromTiers.filter((schoolId) => schoolById.has(schoolId));

    rankedIds.forEach((schoolId, index) => {
      migrated.placed[schoolId] = {
        x: rankedIds.length <= 1 ? 8 : Math.round((index / (rankedIds.length - 1)) * 86 + 4),
        y: 12 + (index % 4) * 19,
      };
    });

    migrated.pool = schools
      .map((school) => school.id)
      .filter((schoolId) => !migrated.placed[schoolId]);

    return normalizeState(migrated);
  } catch {
    return getDefaultState();
  }
}

function normalizeState(rawState) {
  const knownIds = new Set(schools.map((school) => school.id));
  const seen = new Set();
  const state = { pool: [], placed: {} };

  Object.entries(rawState?.placed || {}).forEach(([schoolId, position]) => {
    if (!knownIds.has(schoolId) || seen.has(schoolId)) return;
    state.placed[schoolId] = {
      x: clamp(Number(position.x) || 0, 0, 100),
      y: clamp(Number(position.y) || 0, 0, 100),
    };
    seen.add(schoolId);
  });

  (rawState?.pool || []).forEach((schoolId) => {
    if (knownIds.has(schoolId) && !seen.has(schoolId)) {
      state.pool.push(schoolId);
      seen.add(schoolId);
    }
  });

  schools.forEach((school) => {
    if (!seen.has(school.id)) state.pool.push(school.id);
  });

  return state;
}

function saveState(showStatus = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  if (showStatus) flashSaveStatus();
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
  currentState = loadState();
  renderAxis();
  renderCards();
  applySurfaceGradient();
}

function renderAxis() {
  axisLabels.innerHTML = levels
    .map(
      (level) => `
        <div class="axis-level" style="background: ${level.color}">
          ${level.name}
        </div>
      `
    )
    .join("");
}

function applySurfaceGradient() {
  const step = 100 / levels.length;
  const stops = levels
    .map((level, index) => {
      const start = Math.max(0, index * step - 0.7);
      const end = Math.min(100, (index + 1) * step + 0.7);
      return `${hexToRgba(level.color, 0.32)} ${start}% ${end}%`;
    })
    .join(", ");

  rankSurface.style.setProperty("--surface-gradient", `linear-gradient(90deg, ${stops})`);
}

function renderCards() {
  poolList.innerHTML = "";
  rankSurface.querySelectorAll(".school-card").forEach((card) => card.remove());

  currentState.pool.forEach((schoolId) => {
    const school = schoolById.get(schoolId);
    if (school) poolList.appendChild(createSchoolCard(school));
  });

  Object.entries(currentState.placed).forEach(([schoolId, position]) => {
    const school = schoolById.get(schoolId);
    if (!school) return;
    const card = createSchoolCard(school);
    rankSurface.appendChild(card);
    placeCard(card, position.x, position.y);
  });
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
  card.addEventListener("pointerdown", handlePointerDown);
  return card;
}

function handlePointerDown(event) {
  if (event.button !== 0) return;

  draggedCard = event.currentTarget;
  dragOrigin = draggedCard.parentElement === rankSurface ? "surface" : "pool";

  const cardRect = draggedCard.getBoundingClientRect();
  dragPointerOffset = {
    x: event.clientX - cardRect.left,
    y: event.clientY - cardRect.top,
  };

  draggedCard.classList.add("is-dragging");
  draggedCard.setPointerCapture(event.pointerId);

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp, { once: true });
}

function handlePointerMove(event) {
  if (!draggedCard) return;

  const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
  const overSurface = Boolean(elementBelow?.closest("#rankSurface"));
  const overPool = Boolean(elementBelow?.closest("#poolList"));
  rankSurface.classList.toggle("is-active-drop", overSurface);
  poolList.classList.toggle("is-active-drop", overPool);

  if (overSurface || draggedCard.parentElement === rankSurface) {
    moveCardToSurface(event.clientX, event.clientY);
  }
}

function handlePointerUp(event) {
  if (!draggedCard) return;

  const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
  const droppedInPool = Boolean(elementBelow?.closest("#poolList"));
  const droppedInSurface = Boolean(elementBelow?.closest("#rankSurface")) || draggedCard.parentElement === rankSurface;
  const schoolId = draggedCard.dataset.schoolId;

  if (droppedInPool && draggedCard.parentElement === rankSurface) {
    moveCardToPool(draggedCard);
    delete currentState.placed[schoolId];
    addToPool(schoolId);
  } else if (droppedInSurface) {
    moveCardToSurface(event.clientX, event.clientY);
    removeFromPool(schoolId);
    currentState.placed[schoolId] = getPercentPosition(draggedCard);
  }

  draggedCard.classList.remove("is-dragging");
  rankSurface.classList.remove("is-active-drop");
  poolList.classList.remove("is-active-drop");
  draggedCard = null;
  dragOrigin = null;
  saveState();
}

function moveCardToSurface(pointerX, pointerY) {
  if (draggedCard.parentElement !== rankSurface) {
    rankSurface.appendChild(draggedCard);
  }

  const surfaceRect = rankSurface.getBoundingClientRect();
  const cardRect = draggedCard.getBoundingClientRect();
  const left = pointerX - surfaceRect.left - dragPointerOffset.x;
  const top = pointerY - surfaceRect.top - dragPointerOffset.y;
  const maxLeft = surfaceRect.width - cardRect.width - EDGE_PADDING;
  const maxTop = surfaceRect.height - cardRect.height - EDGE_PADDING;

  draggedCard.style.left = `${clamp(left, EDGE_PADDING, Math.max(EDGE_PADDING, maxLeft))}px`;
  draggedCard.style.top = `${clamp(top, EDGE_PADDING, Math.max(EDGE_PADDING, maxTop))}px`;
}

function moveCardToPool(card) {
  card.style.left = "";
  card.style.top = "";
  poolList.appendChild(card);
}

function placeCard(card, xPercent, yPercent) {
  const surfaceRect = rankSurface.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const maxLeft = Math.max(EDGE_PADDING, surfaceRect.width - cardRect.width - EDGE_PADDING);
  const maxTop = Math.max(EDGE_PADDING, surfaceRect.height - cardRect.height - EDGE_PADDING);

  card.style.left = `${clamp((xPercent / 100) * maxLeft, EDGE_PADDING, maxLeft)}px`;
  card.style.top = `${clamp((yPercent / 100) * maxTop, EDGE_PADDING, maxTop)}px`;
}

function getPercentPosition(card) {
  const surfaceRect = rankSurface.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const left = Number.parseFloat(card.style.left) || EDGE_PADDING;
  const top = Number.parseFloat(card.style.top) || EDGE_PADDING;
  const maxLeft = Math.max(EDGE_PADDING, surfaceRect.width - cardRect.width - EDGE_PADDING);
  const maxTop = Math.max(EDGE_PADDING, surfaceRect.height - cardRect.height - EDGE_PADDING);

  return {
    x: Math.round((left / maxLeft) * 1000) / 10,
    y: Math.round((top / maxTop) * 1000) / 10,
  };
}

function addToPool(schoolId) {
  if (!currentState.pool.includes(schoolId)) currentState.pool.push(schoolId);
}

function removeFromPool(schoolId) {
  currentState.pool = currentState.pool.filter((id) => id !== schoolId);
}

function resetRanking() {
  localStorage.removeItem(STORAGE_KEY);
  currentState = getDefaultState();
  saveState();
  renderCards();
}

function autoArrange() {
  const entries = Object.entries(currentState.placed).sort((a, b) => a[1].x - b[1].x || a[1].y - b[1].y);
  if (!entries.length) return;

  const rowCount = entries.length > 20 ? 4 : entries.length > 10 ? 3 : 2;
  const xStep = entries.length === 1 ? 0 : 92 / (entries.length - 1);

  entries.forEach(([schoolId], index) => {
    currentState.placed[schoolId] = {
      x: Math.min(96, 4 + xStep * index),
      y: 10 + (index % rowCount) * (76 / Math.max(1, rowCount - 1)),
    };
  });

  renderCards();
  saveState();
}

function exportRanking() {
  const rows = Object.entries(currentState.placed)
    .sort((a, b) => a[1].x - b[1].x || a[1].y - b[1].y)
    .map(([schoolId, position], index) => {
      const school = schoolById.get(schoolId);
      const level = getLevelName(position.x);
      return `${index + 1}. ${school.shortName} - ${school.fullName}（${level}，x=${position.x}）`;
    });

  const poolRows = currentState.pool
    .map((schoolId) => schoolById.get(schoolId))
    .filter(Boolean)
    .map((school) => `- ${school.shortName} - ${school.fullName}`);

  exportText.value = [
    "电子通信考研院校难度精细排名",
    "",
    rows.length ? rows.join("\n") : "暂无上榜学校",
    "",
    "待评价区",
    poolRows.length ? poolRows.join("\n") : "无",
  ].join("\n");

  if (typeof exportDialog.showModal === "function") {
    exportDialog.showModal();
  }
}

async function copyExportText() {
  exportText.select();
  try {
    await navigator.clipboard.writeText(exportText.value);
  } catch {
    document.execCommand("copy");
  }
}

function getLevelName(xPercent) {
  const index = Math.min(levels.length - 1, Math.floor((clamp(xPercent, 0, 100) / 100) * levels.length));
  return levels[index].name;
}

function toggleLiveMode() {
  const enabled = document.body.classList.toggle("live-mode");
  liveBtn.textContent = enabled ? "退出直播模式" : "直播模式";
  requestAnimationFrame(repositionPlacedCards);
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

function repositionPlacedCards() {
  rankSurface.querySelectorAll(".school-card").forEach((card) => {
    const position = currentState.placed[card.dataset.schoolId];
    if (position) placeCard(card, position.x, position.y);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(repositionPlacedCards, 120);
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement ? "退出全屏" : "全屏展示";
  requestAnimationFrame(repositionPlacedCards);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("live-mode")) {
    document.body.classList.remove("live-mode");
    liveBtn.textContent = "直播模式";
    requestAnimationFrame(repositionPlacedCards);
  }
});

resetBtn.addEventListener("click", resetRanking);
arrangeBtn.addEventListener("click", autoArrange);
exportBtn.addEventListener("click", exportRanking);
copyExportBtn.addEventListener("click", copyExportText);
liveBtn.addEventListener("click", toggleLiveMode);
fullscreenBtn.addEventListener("click", toggleFullscreen);

render();
