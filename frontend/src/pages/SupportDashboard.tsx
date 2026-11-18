import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge.tsx";
import { CATEGORIES, PRIORITIES, STATUSES, type Counts, type Ticket } from "../types.ts";

export function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load(next = { status, priority, category }) {
    setLoading(true);
    api
      .supportTickets(next)
      .then((data) => {
        setTickets(data.tickets);
        setCounts(data.counts);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1>All tickets</h1>
      {counts ? (
        <div className="grid-cards">
          <div className="card stat">
            Total<strong>{counts.total}</strong>
          </div>
          <div className="card stat">
            Open<strong>{counts.Open}</strong>
          </div>
          <div className="card stat">
            In Progress<strong>{counts["In Progress"]}</strong>
          </div>
          <div className="card stat">
            Resolved<strong>{counts.Resolved}</strong>
          </div>
          <div className="card stat">
            Closed<strong>{counts.Closed}</strong>
          </div>
        </div>
      ) : null}
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          load({ status, priority, category });
        }}
      >
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All</option>
            {PRIORITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">
          Apply filters
        </button>
      </form>
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <div className="alert error">{error}</div> : null}
      {!loading && tickets.length === 0 ? <p className="muted">No tickets match the current filters.</p> : null}
      {tickets.length > 0 ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Employee</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <a href={`/tickets/${ticket.id}`}>{ticket.id.slice(0, 8)}</a>
                  </td>
                  <td>
                    <a href={`/tickets/${ticket.id}`}>{ticket.title}</a>
                  </td>
                  <td>{ticket.createdByName}</td>
                  <td>{ticket.category}</td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
