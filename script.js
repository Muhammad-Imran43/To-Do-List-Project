/**
 * To-Do List App — script.js
 * Features:
 *  - Live clock (real-time updates every second)
 *  - Dynamic weekly calendar row with today highlighted
 *  - Add / delete / toggle tasks
 *  - Filter: All | Pending | Done
 *  - Progress bar
 *  - Persistent storage via localStorage
 */

"use strict";

/* STATE */

/** @type {{ id: number, text: string, time: string, done: boolean }[]} */
let tasks = [];
let activeFilter = "all"; // "all" | "pending" | "done"

/* DOM REFERENCES */
const headerDay    = document.getElementById("headerDay");
const headerDate   = document.getElementById("headerDate");
const headerTime   = document.getElementById("headerTime");
const headerPeriod = document.getElementById("headerPeriod");
const calendarRow  = document.getElementById("calendarRow");
const taskList     = document.getElementById("taskList");
const emptyState   = document.getElementById("emptyState");
const statsText    = document.getElementById("statsText");
const statsPct     = document.getElementById("statsPct");
const progressFill = document.getElementById("progressFill");
const progressBar  = document.getElementById("progressBar");
const newTaskInput = document.getElementById("newTaskInput");
const newTaskTime  = document.getElementById("newTaskTime");
const addTaskBtn   = document.getElementById("addTaskBtn");

/* CLOCK — updates every second */

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, "0");
}

/**
 * Update the live clock and date display.
 */
function updateClock() {
  const now    = new Date();
  const hours  = now.getHours();
  const mins   = now.getMinutes();
  const secs   = now.getSeconds();

  // 12-hour format
  const h12    = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";

  headerTime.textContent   = `${pad(h12)}:${pad(mins)}:${pad(secs)}`;
  headerPeriod.textContent = period;

  // Date display (only needs updating at midnight, but cheap to run)
  const DAYS   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  headerDay.textContent  = DAYS[now.getDay()];
  headerDate.textContent = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

// Start clock immediately, then update every second
updateClock();
setInterval(updateClock, 1000);

/* CALENDAR ROW — current week */

/**
 * Build the 7-day calendar row starting from Sunday of the current week.
 */
function buildCalendar() {
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const today      = new Date();
  const todayDate  = today.getDate();
  const todayDay   = today.getDay(); // 0 = Sunday

  // Find the Sunday of this week
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - todayDay);

  calendarRow.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day  = new Date(sunday);
    day.setDate(sunday.getDate() + i);

    const isToday = day.toDateString() === today.toDateString();
    const isPast  = day < today && !isToday;

    const col = document.createElement("div");
    col.classList.add("cal-day");
    if (isToday) col.classList.add("today");
    if (isPast)  col.classList.add("past");
    col.setAttribute("aria-label", `${DAY_LABELS[i]} ${day.getDate()}`);
    if (isToday) col.setAttribute("aria-current", "date");

    col.innerHTML = `
      <span class="cal-label">${DAY_LABELS[i]}</span>
      <span class="cal-num">${day.getDate()}</span>
    `;

    calendarRow.appendChild(col);
  }
}

buildCalendar();

/* LOCAL STORAGE */

/**
 * Load tasks from localStorage.
 */
function loadTasks() {
  try {
    const stored = localStorage.getItem("todo_tasks");
    tasks = stored ? JSON.parse(stored) : getDefaultTasks();
  } catch {
    tasks = getDefaultTasks();
  }
}

/**
 * Save tasks to localStorage.
 */
function saveTasks() {
  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
}

/**
 * Returns a set of sample tasks for first-time users.
 * @returns {{ id: number, text: string, time: string, done: boolean }[]}
 */
function getDefaultTasks() {
  return [
    { id: Date.now() + 1, text: "Review morning emails",        time: "09:00", done: false },
    { id: Date.now() + 2, text: "Team stand-up meeting",        time: "10:30", done: true  },
    { id: Date.now() + 3, text: "Finish project proposal",      time: "13:00", done: false },
    { id: Date.now() + 4, text: "Lunch with Sarah",             time: "12:30", done: true  },
    { id: Date.now() + 5, text: "Review pull requests",         time: "15:00", done: false },
    { id: Date.now() + 6, text: "Update weekly report",         time: "17:00", done: false },
  ];
}

/* RENDER */

/**
 * Format a "HH:MM" 24h time string to "H:MM AM/PM".
 * @param {string} timeStr
 * @returns {string}
 */
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const period = h < 12 ? "AM" : "PM";
  const h12    = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

/**
 * Get filtered task list based on activeFilter.
 * @returns {typeof tasks}
 */
function getFilteredTasks() {
  if (activeFilter === "pending") return tasks.filter(t => !t.done);
  if (activeFilter === "done")    return tasks.filter(t => t.done);
  return tasks;
}

/**
 * Render the task list and update stats.
 */
function render() {
  const filtered = getFilteredTasks();

  // Update stats
  const total     = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  statsText.textContent    = `${completed} of ${total} completed`;
  statsPct.textContent     = `${pct}%`;
  progressFill.style.width = `${pct}%`;
  progressBar.setAttribute("aria-valuenow", pct);

  // Show / hide empty state
  const isEmpty = filtered.length === 0;
  emptyState.hidden = !isEmpty;
  taskList.style.display = isEmpty ? "none" : "";

  if (isEmpty) return;

  taskList.innerHTML = "";

  filtered.forEach((task, idx) => {
    const card = document.createElement("div");
    card.classList.add("task-card");
    if (task.done) card.classList.add("done");
    card.style.animationDelay = `${idx * 0.04}s`;
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `Task: ${task.text}${task.done ? " (completed)" : ""}`);
    card.dataset.id = task.id;

    const timeDisplay = formatTime(task.time);

    card.innerHTML = `
      <div class="task-check" aria-hidden="true">
        <svg class="check-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 6.5L5.5 10L11 3" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="task-body">
        <span class="task-text">${escapeHTML(task.text)}</span>
      </div>
      ${timeDisplay
        ? `<span class="task-time-badge" aria-label="Time: ${timeDisplay}">${timeDisplay}</span>`
        : ""}
      <button class="task-delete" aria-label="Delete task: ${escapeHTML(task.text)}" title="Delete">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    // Toggle completion on card click (but not delete button)
    card.addEventListener("click", (e) => {
      if (e.target.closest(".task-delete")) return;
      toggleTask(task.id);
    });

    // Delete button
    const deleteBtn = card.querySelector(".task-delete");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTask(task.id, card);
    });

    taskList.appendChild(card);
  });
}

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* TASK ACTIONS */

/**
 * Toggle a task's done state.
 * @param {number} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  render();
}

/**
 * Delete a task with a subtle fade-out animation.
 * @param {number} id
 * @param {HTMLElement} cardEl
 */
function deleteTask(id, cardEl) {
  // Animate out
  cardEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  cardEl.style.opacity    = "0";
  cardEl.style.transform  = "translateX(12px)";

  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }, 200);
}

/**
 * Add a new task from the input fields.
 */
function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) {
    // Shake the input to hint the user
    newTaskInput.classList.add("shake");
    newTaskInput.addEventListener("animationend", () => {
      newTaskInput.classList.remove("shake");
    }, { once: true });
    return;
  }

  const newTask = {
    id:   Date.now(),
    text,
    time: newTaskTime.value || "",
    done: false,
  };

  tasks.unshift(newTask); // Add to top of list
  saveTasks();

  // Reset inputs
  newTaskInput.value = "";
  newTaskTime.value  = "";
  newTaskInput.focus();

  // Switch to "All" filter so the new task is visible
  if (activeFilter !== "all") setFilter("all");
  else render();
}

/* FILTER TABS */

/**
 * Set the active filter and update tab UI.
 * @param {"all"|"pending"|"done"} filter
 */
function setFilter(filter) {
  activeFilter = filter;

  document.querySelectorAll(".tab").forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  render();
}

// Attach tab click handlers
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

/* ADD TASK EVENT LISTENERS */

// Button click
addTaskBtn.addEventListener("click", addTask);

// Enter key in text input
newTaskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// Also allow Enter in time input
newTaskTime.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

/* SHAKE ANIMATION (inline keyframes via JS) */
(function injectShakeStyle() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
    .shake {
      animation: shake 0.35s ease;
    }
  `;
  document.head.appendChild(style);
})();

/* INIT */
loadTasks();
render();