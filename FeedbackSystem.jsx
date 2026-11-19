import { useEffect, useMemo, useState } from "react";

/* =========================================================
   FeedbackSystem.jsx
   A complete feedback system for a React project:
   - Form with name, email, category, star rating, message
   - Validation with clear error messages
   - Saves feedback in localStorage (survives page refresh)
   - Summary: average rating + rating breakdown
   - List with filter by rating and sort order
   - Delete a feedback entry

   Usage:
     import FeedbackSystem from "./FeedbackSystem";
     <FeedbackSystem />
   ========================================================= */

const STORAGE_KEY = "portfolio-feedback";
const CATEGORIES = ["General", "Design", "Projects", "Content", "Bug report"];
const MAX_MESSAGE = 400;

const emptyForm = { name: "", email: "", category: "General", rating: 0, message: "" };

function loadFeedback() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Enter a valid email, like name@example.com.";
  }
  if (!form.rating) errors.rating = "Choose a rating from 1 to 5 stars.";
  if (form.message.trim().length < 10) {
    errors.message = "Write at least 10 characters.";
  }
  return errors;
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/* ---------- Star rating input ---------- */
function StarInput({ value, onChange, hasError }) {
  const [hover, setHover] = useState(0);
  const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"];
  const shown = hover || value;

  return (
    <div>
      <div
        className={`fb-stars ${hasError ? "fb-invalid" : ""}`}
        role="radiogroup"
        aria-label="Rating"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}: ${labels[n - 1]}`}
            className={`fb-star ${n <= shown ? "on" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
        <span className="fb-star-label" aria-live="polite">
          {shown ? labels[shown - 1] : "Select a rating"}
        </span>
      </div>
    </div>
  );
}

function StaticStars({ value }) {
  return (
    <span className="fb-static" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "on" : ""} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/* ---------- Main component ---------- */
export default function FeedbackSystem() {
  const [feedbacks, setFeedbacks] = useState(loadFeedback);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
    } catch {
      /* storage unavailable: feedback stays in memory only */
    }
  }, [feedbacks]);

  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => setSubmitted(false), 4000);
    return () => clearTimeout(t);
  }, [submitted]);

  const stats = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((f) => (counts[f.rating] += 1));
    const total = feedbacks.length;
    const average = total ? feedbacks.reduce((s, f) => s + f.rating, 0) / total : 0;
    return { counts, total, average };
  }, [feedbacks]);

  const visible = useMemo(() => {
    const list = feedbacks.filter((f) => filter === "all" || f.rating === Number(filter));
    return [...list].sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating || b.createdAt - a.createdAt;
      if (sort === "lowest") return a.rating - b.rating || b.createdAt - a.createdAt;
      if (sort === "oldest") return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });
  }, [feedbacks, filter, sort]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: form.name.trim(),
      email: form.email.trim(),
      category: form.category,
      rating: form.rating,
      message: form.message.trim(),
      createdAt: Date.now(),
    };
    setFeedbacks((prev) => [entry, ...prev]);
    setForm(emptyForm);
    setSubmitted(true);
  }

  function handleDelete(id) {
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <section className="fb-root" aria-labelledby="fb-title">
      <style>{css}</style>

      <header className="fb-head">
        <h2 id="fb-title">Share your feedback</h2>
        <p>Tell me what worked and what could be better. It takes about a minute.</p>
      </header>

      <div className="fb-layout">
        {/* ---------- Form ---------- */}
        <form className="fb-form" onSubmit={handleSubmit} noValidate>
          <div className="fb-field">
            <label htmlFor="fb-name">Name</label>
            <input
              id="fb-name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "fb-name-err" : undefined}
              className={errors.name ? "fb-invalid" : ""}
              autoComplete="name"
            />
            {errors.name && <p className="fb-error" id="fb-name-err">{errors.name}</p>}
          </div>

          <div className="fb-field">
            <label htmlFor="fb-email">Email (optional)</label>
            <input
              id="fb-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "fb-email-err" : undefined}
              className={errors.email ? "fb-invalid" : ""}
              autoComplete="email"
            />
            {errors.email && <p className="fb-error" id="fb-email-err">{errors.email}</p>}
          </div>

          <div className="fb-field">
            <label htmlFor="fb-category">What is your feedback about?</label>
            <select
              id="fb-category"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="fb-field">
            <span className="fb-label">Rating</span>
            <StarInput
              value={form.rating}
              onChange={(n) => update("rating", n)}
              hasError={!!errors.rating}
            />
            {errors.rating && <p className="fb-error">{errors.rating}</p>}
          </div>

          <div className="fb-field">
            <label htmlFor="fb-message">Your feedback</label>
            <textarea
              id="fb-message"
              rows={5}
              maxLength={MAX_MESSAGE}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "fb-message-err" : undefined}
              className={errors.message ? "fb-invalid" : ""}
            />
            <div className="fb-meta">
              {errors.message ? (
                <p className="fb-error" id="fb-message-err">{errors.message}</p>
              ) : (
                <span />
              )}
              <span className="fb-count">
                {form.message.length}/{MAX_MESSAGE}
              </span>
            </div>
          </div>

          <button type="submit" className="fb-submit">Send feedback</button>

          {submitted && (
            <p className="fb-success" role="status">
              Feedback sent. Thank you for taking the time.
            </p>
          )}
        </form>

        {/* ---------- Summary + list ---------- */}
        <div className="fb-results">
          <div className="fb-summary">
            <div className="fb-average">
              <strong>{stats.total ? stats.average.toFixed(1) : "–"}</strong>
              <StaticStars value={Math.round(stats.average)} />
              <span>
                {stats.total} review{stats.total === 1 ? "" : "s"}
              </span>
            </div>
            <div className="fb-bars">
              {[5, 4, 3, 2, 1].map((n) => (
                <div className="fb-bar-row" key={n}>
                  <span>{n}★</span>
                  <div className="fb-bar">
                    <div
                      style={{
                        width: stats.total ? `${(stats.counts[n] / stats.total) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="fb-bar-count">{stats.counts[n]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fb-controls">
            <div className="fb-field fb-inline">
              <label htmlFor="fb-filter">Show</label>
              <select id="fb-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="fb-field fb-inline">
              <label htmlFor="fb-sort">Sort by</label>
              <select id="fb-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="fb-empty">
              {feedbacks.length === 0
                ? "No feedback yet. Be the first to leave a review."
                : "No feedback matches this filter. Choose a different rating."}
            </p>
          ) : (
            <ul className="fb-list">
              {visible.map((f) => (
                <li key={f.id} className="fb-item">
                  <div className="fb-item-top">
                    <div>
                      <strong>{f.name}</strong>
                      <span className="fb-tag">{f.category}</span>
                    </div>
                    <StaticStars value={f.rating} />
                  </div>
                  <p className="fb-text">{f.message}</p>
                  <div className="fb-item-bottom">
                    <time dateTime={new Date(f.createdAt).toISOString()}>
                      {timeAgo(f.createdAt)}
                    </time>
                    <button
                      type="button"
                      className="fb-delete"
                      onClick={() => handleDelete(f.id)}
                      aria-label={`Delete feedback from ${f.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Styles (kept in the component so it works as one file) ---------- */
const css = `
.fb-root {
  --ink: #2b2540;
  --muted: #6b6580;
  --line: #ddd8ec;
  --surface: #ffffff;
  --page: #f6f3fb;
  --accent: #7a5cff;
  --accent-dark: #5b3fe0;
  --star: #f5a524;
  --danger: #c4314b;
  --ok: #1f7a4d;
  font-family: "Poppins", system-ui, sans-serif;
  color: var(--ink);
  background: var(--page);
  padding: 48px 20px;
  box-sizing: border-box;
}
.fb-root *, .fb-root *::before, .fb-root *::after { box-sizing: inherit; }
.fb-head { max-width: 1040px; margin: 0 auto 28px; }
.fb-head h2 { margin: 0 0 6px; font-size: 1.9rem; font-weight: 600; }
.fb-head p { margin: 0; color: var(--muted); max-width: 60ch; }

.fb-layout {
  max-width: 1040px; margin: 0 auto;
  display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 28px;
  align-items: start;
}
@media (max-width: 820px) { .fb-layout { grid-template-columns: 1fr; } }

.fb-form, .fb-summary, .fb-item {
  background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
}
.fb-form { padding: 24px; display: grid; gap: 18px; }

.fb-field { display: grid; gap: 6px; }
.fb-field label, .fb-label { font-size: 0.9rem; font-weight: 500; }
.fb-field input, .fb-field textarea, .fb-field select {
  font: inherit; color: inherit; background: #fff;
  border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; width: 100%;
}
.fb-field textarea { resize: vertical; min-height: 110px; }
.fb-field input:focus-visible, .fb-field textarea:focus-visible, .fb-field select:focus-visible,
.fb-star:focus-visible, .fb-submit:focus-visible, .fb-delete:focus-visible {
  outline: 3px solid var(--accent); outline-offset: 2px;
}
.fb-invalid { border-color: var(--danger) !important; }
.fb-error { margin: 0; color: var(--danger); font-size: 0.85rem; }
.fb-meta { display: flex; justify-content: space-between; gap: 12px; }
.fb-count { font-size: 0.8rem; color: var(--muted); margin-left: auto; }

.fb-stars { display: flex; align-items: center; gap: 2px; padding: 4px; border-radius: 8px; }
.fb-stars.fb-invalid { border: 1px solid var(--danger); }
.fb-star {
  background: none; border: 0; cursor: pointer; font-size: 2rem; line-height: 1;
  color: #cfc9e0; padding: 2px 3px; border-radius: 6px; transition: transform 0.12s;
}
.fb-star.on { color: var(--star); }
.fb-star:hover { transform: scale(1.12); }
.fb-star-label { margin-left: 10px; font-size: 0.85rem; color: var(--muted); }

.fb-submit {
  font: inherit; font-weight: 600; color: #fff; background: var(--accent);
  border: 0; border-radius: 10px; padding: 12px 18px; cursor: pointer;
  transition: background 0.15s;
}
.fb-submit:hover { background: var(--accent-dark); }
.fb-success { margin: 0; color: var(--ok); font-weight: 500; }

.fb-results { display: grid; gap: 18px; }
.fb-summary { padding: 20px 24px; display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: center; }
@media (max-width: 480px) { .fb-summary { grid-template-columns: 1fr; } }
.fb-average { display: grid; justify-items: center; gap: 2px; }
.fb-average strong { font-size: 2.8rem; font-weight: 600; line-height: 1; }
.fb-average span:last-child { font-size: 0.85rem; color: var(--muted); }

.fb-static span { color: #cfc9e0; font-size: 1.05rem; }
.fb-static span.on { color: var(--star); }

.fb-bars { display: grid; gap: 6px; }
.fb-bar-row { display: grid; grid-template-columns: 28px 1fr 24px; gap: 10px; align-items: center; font-size: 0.8rem; color: var(--muted); }
.fb-bar { height: 8px; background: #ece8f6; border-radius: 99px; overflow: hidden; }
.fb-bar div { height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.4s ease; }
.fb-bar-count { text-align: right; }

.fb-controls { display: flex; gap: 14px; flex-wrap: wrap; }
.fb-inline { grid-auto-flow: column; align-items: center; gap: 8px; }
.fb-inline select { width: auto; }

.fb-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.fb-item { padding: 16px 18px; display: grid; gap: 8px; }
.fb-item-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.fb-tag { margin-left: 10px; font-size: 0.75rem; color: var(--accent-dark); background: #efeaff; padding: 2px 9px; border-radius: 99px; }
.fb-text { margin: 0; line-height: 1.6; overflow-wrap: anywhere; }
.fb-item-bottom { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--muted); }
.fb-delete { font: inherit; font-size: 0.8rem; color: var(--danger); background: none; border: 0; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
.fb-delete:hover { text-decoration: underline; }
.fb-empty { margin: 0; padding: 28px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line); border-radius: 14px; }

@media (prefers-reduced-motion: reduce) {
  .fb-root * { transition: none !important; }
}
`;
