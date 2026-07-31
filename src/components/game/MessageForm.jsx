// MessageForm.jsx
// The compose box for a new message. It handles its own submit event and
// hands the finished text to Game, which knows who the recipients are.

function MessageForm({ recipientCount, onSend, onCancel }) {
  function handleSubmit(e) {
    e.preventDefault();
    const content = e.target.elements.content.value.trim();
    if (!content) return;
    onSend(content);
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        Sending to {recipientCount} player{recipientCount === 1 ? "" : "s"}.
      </p>
      <input
        type="text"
        name="content"
        placeholder="Enter your message here"
        maxLength={256}
        autoFocus
      />
      <button type="submit">Send message</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

export default MessageForm;