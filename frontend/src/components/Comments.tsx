import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api.ts";
import type { Comment } from "../types.ts";

export function Comments({ ticketId }: { ticketId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api
      .comments(ticketId)
      .then((data) => setComments(data.comments))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [ticketId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!text.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setSubmitting(true);
    try {
      await api.addComment(ticketId, text);
      setText("");
      setSuccess("Comment added.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading">Comments</h2>
      {loading ? <p className="muted">Loading comments…</p> : null}
      {!loading && comments.length === 0 ? <p className="muted">No comments yet.</p> : null}
      {comments.map((comment) => (
        <article className="comment" key={comment.id}>
          <p>{comment.text}</p>
          <p className="comment-meta">
            {comment.authorName} · {new Date(comment.createdAt).toLocaleString()}
          </p>
        </article>
      ))}
      <form onSubmit={onSubmit} className="form">
        <label>
          Add a comment
          <textarea value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add comment"}
        </button>
      </form>
    </section>
  );
}
