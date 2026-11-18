import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api.ts";
import { useAuth } from "../auth.tsx";
import { Comments } from "../components/Comments.tsx";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge.tsx";
import { CATEGORIES, PRIORITIES, type Status, type Ticket } from "../types.ts";

const NEXT: Record<Status, Status | null> = {
  Open: "In Progress",
  "In Progress": "Resolved",
  Resolved: "Closed",
  Closed: null,
};

export function TicketDetailsPage({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const canEdit = user?.role === "employee" && user.id === ticket?.createdBy && ticket?.status !== "Closed";
  const nextStatus = ticket ? NEXT[ticket.status] : null;

  useEffect(() => {
    api
      .getTicket(ticketId)
      .then((data) => {
        setTicket(data.ticket);
        setTitle(data.ticket.title);
        setDescription(data.ticket.description);
        setCategory(data.ticket.category);
        setPriority(data.ticket.priority);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticketId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api.updateTicket(ticketId, { title, description, category, priority });
      setTicket(data.ticket);
      setSuccess("Ticket updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function changeStatus() {
    if (!nextStatus) return;
    if (!window.confirm(`Change status to ${nextStatus}?`)) return;
    setError("");
    try {
      const data = await api.updateStatus(ticketId, nextStatus);
      setTicket(data.ticket);
      setSuccess(`Status updated to ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    }
  }

  if (loading) return <p className="muted">Loading ticket…</p>;
  if (!ticket) return <div className="alert error">{error || "Ticket not found."}</div>;

  return (
    <>
      <h1>{ticket.title}</h1>
      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}
      <div className="card details-grid">
        <div>
          <strong>Ticket ID</strong>
          <div>{ticket.id}</div>
        </div>
        <div>
          <strong>Status</strong>
          <div>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div>
          <strong>Priority</strong>
          <div>
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <div>
          <strong>Category</strong>
          <div>{ticket.category}</div>
        </div>
        <div>
          <strong>Created by</strong>
          <div>{ticket.createdByName}</div>
        </div>
        <div>
          <strong>Created</strong>
          <div>{new Date(ticket.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <strong>Last updated</strong>
          <div>{new Date(ticket.updatedAt).toLocaleString()}</div>
        </div>
      </div>
      {canEdit ? (
        <form className="form card" onSubmit={save} style={{ marginTop: "1rem" }}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="btn" type="submit">
            Save changes
          </button>
        </form>
      ) : (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p>{ticket.description}</p>
        </div>
      )}
      {user?.role === "support" && nextStatus ? (
        <div className="actions">
          <button className="btn" type="button" onClick={() => void changeStatus()}>
            Set status to {nextStatus}
          </button>
        </div>
      ) : null}
      <Comments ticketId={ticket.id} />
    </>
  );
}
