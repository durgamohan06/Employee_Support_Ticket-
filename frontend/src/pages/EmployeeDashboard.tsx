import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge.tsx";
import type { Counts, Ticket } from "../types.ts";

export function EmployeeDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myTickets()
      .then((data) => {
        setTickets(data.tickets);
        setCounts(data.counts);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="toolbar">
        <h1>My tickets</h1>
        <a className="btn" href="/tickets/new">
          Create ticket
        </a>
      </div>
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <div className="alert error">{error}</div> : null}
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
      {!loading && tickets.length === 0 ? <p className="muted">You have not submitted any tickets yet.</p> : null}
      {tickets.length > 0 ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
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
