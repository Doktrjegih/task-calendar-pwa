import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  ListTodo,
  Plus,
  Sun,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { readTasks, saveTask, removeTask, type Task } from "./store";
import "./style.css";
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = key(new Date());
const dateLabel = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
function App() {
  const [tasks, setTasks] = useState<Task[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  const [selected, setSelected] = useState(today),
    [month, setMonth] = useState(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
  const [filter, setFilter] = useState("all"),
    [view, setView] = useState("calendar"),
    [editing, setEditing] = useState<Partial<Task> | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [help, setHelp] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    readTasks()
      .then((t) => {
        setTasks(t);
        setLoaded(true);
      })
      .catch(() =>
        setError(
          "Your task storage could not be opened. Check that browser storage is enabled, then reload.",
        ),
      );
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (editing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editing]);
  async function put(t: Task) {
    try {
      await saveTask(t);
      setTasks((old) => [...old.filter((x) => x.id !== t.id), t]);
      setError("");
      return true;
    } catch {
      setError(
        "Could not save. Your changes have not been stored. Please try again.",
      );
      return false;
    }
  }
  async function del(t: Task) {
    if (!confirm(`Delete “${t.title}”?`)) return;
    try {
      await removeTask(t.id);
      setTasks((old) => old.filter((x) => x.id !== t.id));
      setEditing(null);
    } catch {
      setError("Could not delete this task. Please try again.");
    }
  }
  const daily = tasks.filter((t) => t.due === selected),
    done = daily.filter((t) => t.done).length;
  const visible = (view === "calendar" ? daily : tasks)
    .filter((t) => filter === "all" || (filter === "done" ? t.done : !t.done))
    .sort(
      (a, b) =>
        a.due.localeCompare(b.due) ||
        Number(a.done) - Number(b.done) ||
        { high: 0, medium: 1, low: 2 }[a.priority] -
          { high: 0, medium: 1, low: 2 }[b.priority] ||
        a.created - b.created,
    );
  const cells = Array.from(
    {
      length:
        Math.ceil(
          (month.getDay() +
            new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) /
            7,
        ) * 7,
    },
    (_, i) =>
      new Date(month.getFullYear(), month.getMonth(), i - month.getDay() + 1),
  );
  function jump() {
    setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setSelected(today);
  }
  return (
    <div className="app">
      <aside>
        <a className="brand" href="/" aria-label="Daylight home">
          <span className="brand-icon">
            <Sun size={23} />
          </span>
          daylight<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">YOUR SPACE</div>
        <nav>
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            <CalendarDays size={19} /> Calendar <span>01</span>
          </button>
          <button
            className={view === "tasks" ? "active" : ""}
            onClick={() => setView("tasks")}
          >
            <ListTodo size={19} /> All tasks <span>{tasks.length}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-mark">
            <span /> A little more present.
          </div>
          <p>
            Your plans stay on this device.
            <br />
            No accounts. Just you.
          </p>
          <button className="install" onClick={() => setHelp(!help)}>
            Add to your home screen <ArrowUpRight size={16} />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            Your space <span>/</span>{" "}
            {view === "calendar" ? "Calendar" : "All tasks"}
          </div>
          <span className="connection">
            {online ? (
              <>
                <span className="status-dot" /> Saved on this device
              </>
            ) : (
              <>
                <WifiOff size={14} /> Offline · ready to use
              </>
            )}
          </span>
        </header>
        <section className="heading">
          <div>
            <div className="eyebrow">MAKE ROOM FOR WHAT MATTERS</div>
            <h1>A little plan. A lighter day.</h1>
            <p>See the month ahead. Take it one task at a time.</p>
          </div>
          <button
            className="primary"
            disabled={!loaded}
            onClick={() => setEditing({ due: selected, priority: "medium" })}
          >
            <Plus size={18} /> New task
          </button>
        </section>
        {help && (
          <div className="notice">
            On iPhone, open this site in Safari, tap Share, then “Add to Home
            Screen”. Open it once online to prepare offline access. Tasks are
            stored only in this browser; clearing site data removes them.{" "}
            <button
              aria-label="Dismiss instructions"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        <div className="content">
          <section className="calendar-panel">
            <div className="panel-top">
              <div>
                <span className="eyebrow">
                  {view === "calendar"
                    ? "YOUR MONTH AT A GLANCE"
                    : "EVERYTHING IN ONE PLACE"}
                </span>
                <h2>
                  {month.toLocaleDateString("en-US", { month: "long" })}{" "}
                  <span>{month.getFullYear()}</span>
                </h2>
              </div>
              <div className="month-controls">
                <button className="today" onClick={jump}>
                  Today
                </button>
                <button
                  aria-label="Previous month"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft size={19} />
                </button>
                <button
                  aria-label="Next month"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>
            <div className="weekdays">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div
              className="calendar"
              role="group"
              aria-label="Monthly calendar"
            >
              {cells.map((d) => {
                const s = key(d),
                  ts = tasks.filter((t) => t.due === s);
                return (
                  <button
                    key={s}
                    aria-label={`${dateLabel(s)}, ${ts.length} tasks`}
                    aria-pressed={selected === s}
                    className={`day ${d.getMonth() !== month.getMonth() ? "muted" : ""} ${s === selected ? "selected" : ""} ${s === today ? "is-today" : ""}`}
                    onClick={() => {
                      setSelected(s);
                      setView("calendar");
                    }}
                  >
                    <span className="day-number">{d.getDate()}</span>
                    <div className="day-tasks">
                      {ts.slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className={`calendar-task ${t.priority} ${t.done ? "completed" : ""}`}
                        >
                          <i />
                          {t.title}
                        </span>
                      ))}
                      {ts.length > 2 && <small>+{ts.length - 2} more</small>}
                    </div>
                    <div className="mobile-dots">
                      {ts.slice(0, 3).map((t) => (
                        <i
                          key={t.id}
                          className={t.done ? "finished" : t.priority}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="calendar-footer">
              <span>
                <i className="legend high" /> High priority
              </span>
              <span>
                <i className="legend medium" /> Medium
              </span>
              <span>
                <i className="legend low" /> Low
              </span>
              <span className="footer-hint">A fresh start, every day.</span>
            </div>
          </section>
          <section className="task-panel">
            <div className="task-heading">
              <div className="eyebrow">
                {view === "calendar"
                  ? "ONE DAY AT A TIME"
                  : "YOUR TASK COLLECTION"}
              </div>
              <h2>
                {view === "calendar"
                  ? new Date(selected + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric" },
                    )
                  : "All tasks"}
                <span className="count">
                  {view === "calendar" ? daily.length : tasks.length}
                </span>
              </h2>
              <p>
                {view === "calendar"
                  ? new Date(selected + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "long" },
                    )
                  : "Big plans, small steps."}
              </p>
            </div>
            <div className="progress-label">
              <span>
                {view === "calendar"
                  ? `${done} of ${daily.length} completed`
                  : `${tasks.filter((t) => t.done).length} completed`}
              </span>
              <span>
                {view === "calendar"
                  ? daily.length
                    ? Math.round((done / daily.length) * 100)
                    : 0
                  : tasks.length
                    ? Math.round(
                        (tasks.filter((t) => t.done).length / tasks.length) *
                          100,
                      )
                    : 0}
                %
              </span>
            </div>
            <div className="progress">
              <i
                style={{
                  width: `${view === "calendar" ? (daily.length ? (done / daily.length) * 100 : 0) : tasks.length ? (tasks.filter((t) => t.done).length / tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="filters">
              {[
                ["all", "All"],
                ["open", "To do"],
                ["done", "Completed"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={filter === v ? "chosen" : ""}
                  onClick={() => setFilter(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="task-list">
              {!loaded ? (
                <p>Opening your space…</p>
              ) : visible.length ? (
                visible.map((t) => (
                  <article
                    className={`task ${t.done ? "done" : ""}`}
                    key={t.id}
                  >
                    <button
                      className="check"
                      aria-label={`${t.done ? "Reopen" : "Complete"} ${t.title}`}
                      onClick={() => put({ ...t, done: !t.done })}
                    >
                      {t.done ? <Check size={16} /> : <Circle size={20} />}
                    </button>
                    <button
                      className="task-detail"
                      onClick={() => setEditing(t)}
                    >
                      <strong>{t.title}</strong>
                      {t.notes && <p>{t.notes}</p>}
                      <span className={`priority ${t.priority}`}>
                        <i />
                        {t.priority} priority
                      </span>
                      {view === "tasks" && (
                        <small className="due">{dateLabel(t.due)}</small>
                      )}
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty">
                  <div>
                    <Sun size={30} strokeWidth={1.3} />
                  </div>
                  <h3>
                    {filter === "all"
                      ? "A little breathing room."
                      : "All clear here."}
                  </h3>
                  <p>
                    {filter === "all"
                      ? "No tasks yet. Add something to look forward to, or something to get done."
                      : "No tasks match this view."}
                  </p>
                </div>
              )}
            </div>
            <button
              disabled={!loaded}
              className="add-task"
              onClick={() => setEditing({ due: selected, priority: "medium" })}
            >
              <Plus size={17} /> Add a task
            </button>
            <div className="gentle-note">
              “You don’t have to do it all.
              <br />
              Just the next right thing.”<span>ONE STEP IS ENOUGH</span>
            </div>
          </section>
        </div>
        <footer>
          <button onClick={() => setHelp(!help)}>Install on iPhone ↗</button>
          <span>
            <Sun size={13} /> Made for your everyday
          </span>
        </footer>
      </main>
      <dialog
        ref={dialog}
        onCancel={() => setEditing(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setEditing(null);
        }}
      >
        {editing && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const title = String(f.get("title")).trim();
              if (!title) return;
              const t: Task = {
                id: editing.id || crypto.randomUUID(),
                created: editing.created || Date.now(),
                done: editing.done || false,
                title,
                notes: String(f.get("notes")).trim(),
                due: String(f.get("due")),
                priority: f.get("priority") as Task["priority"],
              };
              if (await put(t)) setEditing(null);
            }}
          >
            <div className="modal-heading">
              <h2>{editing.id ? "Edit task" : "A new little plan"}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <label>
              Task
              <input
                name="title"
                autoFocus
                required
                maxLength={160}
                placeholder="What’s on your mind?"
                defaultValue={editing.title}
              />
            </label>
            <label>
              Notes
              <textarea
                name="notes"
                maxLength={4000}
                placeholder="A few details (optional)"
                defaultValue={editing.notes}
              />
            </label>
            <div className="form-row">
              <label>
                Due date
                <input
                  name="due"
                  type="date"
                  required
                  defaultValue={editing.due}
                />
              </label>
              <label>
                Priority
                <select name="priority" defaultValue={editing.priority}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              {editing.id && (
                <button
                  type="button"
                  className="delete"
                  onClick={() => del(editing as Task)}
                >
                  <Trash2 size={17} /> Delete
                </button>
              )}
              <button className="primary" type="submit">
                {editing.id ? "Save changes" : "Create task"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
