import { useState, type FormEvent } from "react";
import { api } from "../api.ts";
import { CATEGORIES, PRIORITIES } from "../types.ts";

export function CreateTicketPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim() || title.trim().length > 100 || !description.trim()) {
      setError("Title (max 100 characters) and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.createTicket({ title, description, category, priority });
      setSuccess("Ticket created.");
      window.location.href = `/tickets/${data.ticket.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Create ticket</h1>
      <form className="form card" onSubmit={onSubmit}>
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
        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </>
  );
}
