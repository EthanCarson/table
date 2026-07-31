// MessageView.jsx
// Shows one incoming message and nothing else. Closing it tells Game to
// delete the notification and load the next one in the queue.

function MessageView({ senderName, content, onClose }) {
  return (
    <div>
      <h1>{senderName ? `${senderName} messaged:` : "Message:"}</h1>
      <p>{content}</p>
      <button type="button" onClick={onClose}>
        Close message
      </button>
    </div>
  );
}

export default MessageView;