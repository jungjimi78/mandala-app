
const STORAGE_KEY = "growth-mandala-standalone-v1";

const gradients = {
  purple: ["#8b5cf6", "#d946ef", "#ec4899"],
  pink: ["#ec4899", "#fb7185", "#f97316"],
  blue: ["#3b82f6", "#06b6d4", "#14b8a6"],
  green: ["#10b981", "#22c55e", "#a3e635"],
  orange: ["#f97316", "#f59e0b", "#fde047"]
};

const colorNames = {
  purple: "보라", pink: "핑크", blue: "블루", green: "그린", orange: "오렌지"
};

const defaultData = {
  appName: "성장 만트라",
  mantra: "나는 바쁜 와중에도 나를 성장시키는 사람이다",
  color: "purple",
  categories: [
    { id: "time", title: "시간관리", items: ["하루 10분 영어", "SNS 30분 제한", "아침 10분 나시간", "해야 할 일 3개만"] },
    { id: "english", title: "영어 성장", items: ["10문장 쉐도잉", "ChatGPT 대화 연습", "표현 1개 내꺼 만들기", "틀려도 말하기"] },
    { id: "health", title: "몸 & 건강", items: ["스트레칭 10분", "물 많이 마시기", "수면 7시간", "건강식 1끼"] },
    { id: "mind", title: "멘탈 관리", items: ["완벽보다 지속", "비교 안하기", "감사 1개", "나한테 말 예쁘게 하기"] },
    { id: "mom", title: "엄마로서 성장", items: ["아이 말 끝까지 듣기", "하루 1번 칭찬", "잔소리 대신 질문", "함께 웃는 시간"] },
    { id: "money", title: "재정 & 미래", items: ["VOO 꾸준히", "지출 체크", "불필요 소비 줄이기", "장기 투자 유지"] },
    { id: "routine", title: "루틴 & 실행력", items: ["체크리스트 확인", "5분 룰", "바로 실행", "기록 남기기"] },
    { id: "rest", title: "나 자신 & 여유", items: ["나만의 시간", "좋아하는 것 하기", "카페/사우나 타임", "아무것도 안하기"] }
  ]
};

let state = {
  data: structuredClone(defaultData),
  logs: {},
  selectedDate: todayKey(),
  editMode: false,
  tab: "home"
};

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(key) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state.data, logs: state.logs }));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      state.data = saved.data || structuredClone(defaultData);
      state.logs = saved.logs || {};
    }
  } catch {}
}

function setTheme() {
  const c = gradients[state.data.color] || gradients.purple;
  document.documentElement.style.setProperty("--grad", `linear-gradient(135deg,${c[0]},${c[1]},${c[2]})`);
  document.documentElement.style.setProperty("--soft", hexToRgba(c[0], .22));
  document.querySelector('meta[name="theme-color"]').setAttribute("content", c[0]);
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.replace("#",""), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

function allItemKeys() {
  return state.data.categories.flatMap(cat => cat.items.map(item => `${cat.id}::${item}`));
}

function render() {
  setTheme();
  save();

  document.getElementById("appNameTitle").textContent = state.data.appName;
  document.getElementById("appNameInput").value = state.data.appName;
  document.getElementById("mantraText").textContent = state.data.mantra;
  document.getElementById("mantraEdit").value = state.data.mantra;
  document.getElementById("mantraText").classList.toggle("hidden", state.editMode);
  document.getElementById("mantraEdit").classList.toggle("hidden", !state.editMode);
  document.getElementById("editBtn").textContent = state.editMode ? "저장" : "수정";

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`${state.tab}View`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === state.tab));

  document.getElementById("dateLabel").textContent = formatDate(state.selectedDate);

  const keys = allItemKeys();
  const dayLog = state.logs[state.selectedDate] || {};
  const completed = keys.filter(k => dayLog[k]).length;
  const total = keys.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.getElementById("progressText").textContent = `${completed}/${total} · ${percent}%`;
  document.getElementById("progressBar").style.width = `${percent}%`;

  renderCategories();
  renderStats();
  renderColors();
}

function renderCategories() {
  const wrap = document.getElementById("categoryList");
  wrap.innerHTML = "";

  const dayLog = state.logs[state.selectedDate] || {};

  state.data.categories.forEach(cat => {
    const section = document.createElement("section");
    section.className = "category";

    if (state.editMode) {
      const title = document.createElement("input");
      title.className = "title-input";
      title.value = cat.title;
      title.oninput = e => { cat.title = e.target.value; save(); };
      section.appendChild(title);
    } else {
      const h = document.createElement("h3");
      h.textContent = cat.title;
      section.appendChild(h);
    }

    cat.items.forEach((item, index) => {
      const key = `${cat.id}::${item}`;
      const done = !!dayLog[key];

      const row = document.createElement("div");
      row.className = "item-row" + (done ? " done" : "");

      const check = document.createElement("button");
      check.className = "check";
      check.textContent = done ? "✓" : "";
      check.onclick = () => toggleItem(cat.id, item);
      row.appendChild(check);

      if (state.editMode) {
        const input = document.createElement("input");
        input.className = "item-input";
        input.value = item;
        input.oninput = e => { cat.items[index] = e.target.value; save(); };
        row.appendChild(input);

        const del = document.createElement("button");
        del.className = "delete";
        del.textContent = "×";
        del.onclick = () => { cat.items.splice(index, 1); render(); };
        row.appendChild(del);
      } else {
        const span = document.createElement("div");
        span.className = "item-text";
        span.textContent = item;
        row.appendChild(span);
      }

      section.appendChild(row);
    });

    if (state.editMode) {
      const add = document.createElement("div");
      add.className = "add-row";
      const input = document.createElement("input");
      input.className = "add-input";
      input.placeholder = "새 항목 추가";
      const btn = document.createElement("button");
      btn.className = "add-btn";
      btn.textContent = "+";
      const addItem = () => {
        const text = input.value.trim();
        if (!text) return;
        cat.items.push(text);
        input.value = "";
        render();
      };
      btn.onclick = addItem;
      input.onkeydown = e => { if (e.key === "Enter") addItem(); };
      add.append(input, btn);
      section.appendChild(add);
    }

    wrap.appendChild(section);
  });
}

function renderStats() {
  const wrap = document.getElementById("statsList");
  wrap.innerHTML = "";
  const keys = allItemKeys();
  const total = keys.length;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const log = state.logs[key] || {};
    const count = keys.filter(k => log[k]).length;
    const percent = total ? Math.round(count / total * 100) : 0;

    const item = document.createElement("div");
    item.className = "stat-item";
    item.innerHTML = `
      <div class="stat-top"><span>${formatDate(key)}</span><span>${count}/${total} · ${percent}%</span></div>
      <div class="stat-bar"><div class="stat-fill" style="width:${percent}%"></div></div>
    `;
    wrap.appendChild(item);
  }
}

function renderColors() {
  const wrap = document.getElementById("colorPicker");
  wrap.innerHTML = "";
  Object.keys(gradients).forEach(key => {
    const b = document.createElement("button");
    b.className = "color-dot" + (state.data.color === key ? " active" : "");
    b.title = colorNames[key];
    b.style.background = `linear-gradient(135deg,${gradients[key].join(",")})`;
    b.onclick = () => { state.data.color = key; render(); };
    wrap.appendChild(b);
  });
}

function toggleItem(catId, item) {
  const key = `${catId}::${item}`;
  state.logs[state.selectedDate] = state.logs[state.selectedDate] || {};
  state.logs[state.selectedDate][key] = !state.logs[state.selectedDate][key];
  if (navigator.vibrate) navigator.vibrate(35);
  render();
}

function changeDate(days) {
  const d = new Date(state.selectedDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  state.selectedDate = todayKey(d);
  render();
}

load();
render();

document.getElementById("editBtn").onclick = () => {
  state.editMode = !state.editMode;
  render();
};

document.getElementById("mantraEdit").oninput = e => {
  state.data.mantra = e.target.value;
  save();
};

document.getElementById("appNameInput").oninput = e => {
  state.data.appName = e.target.value;
  render();
};

document.getElementById("prevDate").onclick = () => changeDate(-1);
document.getElementById("nextDate").onclick = () => changeDate(1);
document.getElementById("todayBtn").onclick = () => { state.selectedDate = todayKey(); render(); };

document.getElementById("resetDayBtn").onclick = () => {
  if (confirm("선택한 날짜의 체크 기록을 지울까?")) {
    state.logs[state.selectedDate] = {};
    render();
  }
};

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    state.tab = btn.dataset.tab;
    render();
  };
});
