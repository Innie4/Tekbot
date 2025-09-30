import React, { useState } from "react";

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm TekAssist. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");
    // TODO: Integrate with backend AI API
  };

  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="w-full max-w-3xl glass-card shadow-2xl rounded-2xl border border-gray-800">
        <div className="p-5 border-b border-gray-700 bg-tech-dark rounded-t-2xl flex items-center justify-between">
          <span className="font-bold text-2xl text-electric-blue">TekAssist Bot</span>
          <span className="text-xs text-gray-400">AI Assistant</span>
        </div>
        <div className="p-6 h-64 overflow-y-auto bg-background text-foreground rounded-b-xl">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-3 flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
              <span className={`inline-block px-4 py-2 rounded-xl shadow ${msg.sender === "bot" ? "bg-glass text-white" : "bg-electric-cyan text-white"}`}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        <div className="p-4 flex bg-background rounded-b-2xl border-t border-gray-700">
          <input
            className="flex-1 glass-input px-4 py-3 rounded-xl mr-3 text-foreground border border-gray-700 focus:outline-none focus:ring-2 focus:ring-electric-blue"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            className="glass-button px-6 py-3 rounded-xl text-electric-blue font-bold shadow hover:bg-electric-blue hover:text-white transition"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}