import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Chatbot.css";
import MarkdownRenderer from "./MarkdownRenderer";
import Login from "./login";
import { useNavigate } from "react-router-dom";

const Chatbot = () => {
  // const [messages, setMessages] = useState([]);
  const [messages, setMessages] = useState(() => {
    const storedMessages = sessionStorage.getItem("guestChat");
    return storedMessages ? JSON.parse(storedMessages) : [];
  });
  
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem("session_id") || generateSessionId());
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [lastSender, setLastSender] = useState(null);
  const [isHistoryLoad, setIsHistoryLoad] = useState(false);
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const chatBoxRef = useRef(null);
  const navigate = useNavigate();

 useEffect(() => {
    const box = chatBoxRef.current;
    if (!box || messages.length === 0) return;
  
    if (isHistoryLoad) {
      box.scrollTop = box.scrollHeight; // ✅ Scroll to bottom on history load
      setIsHistoryLoad(false); // 👈 Reset so it doesn't scroll every time
      return;
    }
  
    if (lastSender === "user") {
      box.scrollTop = box.scrollHeight; // Scroll fully for new user message
    } else if (lastSender === "bot") {
      const scrollOffset = 150; // Scroll a little for bot message
      box.scrollTop = box.scrollTop + scrollOffset;
    }
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn && chatHistory.length === 0) {
      fetchChatHistory();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.removeItem("guestChat");
    }
  }, [isLoggedIn]);


  useEffect(() => {
        localStorage.setItem("session_id", sessionId);
        if (isLoggedIn) {
            fetchChatHistory();
        }
    }, [sessionId, isLoggedIn]);

  // Close sidebar if click happens outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);
  

    function generateSessionId() {
        return crypto.randomUUID(); // Generates a new unique ID
    }
// let sessionId = localStorage.getItem("session_id");
  const getSessionId = () => {
    let sessionId = localStorage.getItem("session_id");

    if (!sessionId) {
      const newSessionId = generateSessionId(); 
      setSessionId(newSessionId);
      setSelectedSessionId(newSessionId); // ✅ Track new one
    }
    

    return sessionId;
};


async function startNewChat() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch("https://chatbot-bysajid-3685.up.railway.app/api/create-session/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("❌ Failed to create new session");
    }

    const data = await response.json();
    const newSessionId = data.session_id;

    // Frontend state update
    setSessionId(newSessionId);
    setSelectedSessionId(newSessionId);  // 👈 This is important
    setMessages([]);
    setChatHistory((prev) => ({
      ...prev,
      [newSessionId]: [],
    }));

    localStorage.setItem("session_id", newSessionId);

    // console.log("✅ New session created:", newSessionId);

  } catch (error) {
    console.error("🚨 Error creating new session:", error);
  }
}
  

  const fetchChatHistory = async () => {
    try {
        const token = localStorage.getItem("token");
        // console.log("🔑 Stored Token:", token); // Debugging: Check token

        if (!token) {
            console.warn("⚠️ No token found, user might not be logged in.");
            return;
        }


        // console.log("📡 Fetching chat history from API...");

        // let session_id = localStorage.getItem("session_id");
        const session_id = getSessionId();

        if (!session_id) {
            console.warn("⚠️ No session found, requesting a new session...");
            const sessionResponse = await fetch("https://chatbot-bysajid-3685.up.railway.app/api/create-session/", {
                method: "POST",
                headers: { "Authorization": `Token ${token}` }
            });

            if (!sessionResponse.ok) {
                throw new Error("❌ Failed to create a new session");
            }

            const sessionData = await sessionResponse.json();
            session_id = sessionData.session_id;
            // console.log("💾 New session created:", session_id);
          }
        const response = await fetch(`https://chatbot-bysajid-3685.up.railway.app/api/all-chat-histories/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}` // DRF Token Auth format
                // "Conversation-ID": session_id
            },
        });

        // console.log("📶 Response Status:", response.status); // Debugging API response status
        // console.log("📶 Response Status:", response); // Debugging API response status 
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`❌ Failed to fetch chat history: ${response.statusText}, Response: ${errorText}`);
        }

        const data = await response.json();
        // console.log("📩 Raw API Response:", data); // Debugging fetched data

        // setChatHistory(Array.isArray(data) ? data : data.chat_history || []);
        setChatHistory(data.chat_sessions || {});
        // console.log("✅ Chat history state updated successfully.");
        // console.log(data.chat_history);


    } catch (error) {
        console.error("🚨 Error fetching chat history:", error);
        setChatHistory([]);
    }
};

 
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { text: input, sender: "user" };
    setLastSender("user");
    setMessages((prev) =>
      Array.isArray(prev) ? [...prev, newMessage] : [newMessage]
    );

    if (!isLoggedIn) {
        sessionStorage.setItem("guestChat", JSON.stringify([...messages, newMessage]));
    }

    setInput("");
    setTyping(true);

    try {
        const token = localStorage.getItem("token");
        // let sessionId = getSessionId();
        let sessionId = selectedSessionId || getSessionId();  // ✅ Prefer selected session
        // const headers = { "Content-Type": "application/json" };
        // if (token) headers["Authorization"] = `Token ${token}`;
        const headers = {
          "Content-Type": "application/json",
          ...(isLoggedIn && token ? { Authorization: `Token ${token}` } : {})
        };


        // console.log("📤 Sending Message to API:", input);
        if (!sessionId) {
          // console.log("🔵 Creating a new session...");
          const newSessionId = generateSessionId();  // Agar session ID nahi hai to ek new ID generate karo
          setSessionId(newSessionId);
      }

      const response = await fetch("https://chatbot-bysajid-3685.up.railway.app/api/chat/", {
        method: "POST",
        headers: headers,  // ✅ This respects `isLoggedIn && token` check
        body: JSON.stringify({ message: input, session_id: sessionId || localStorage.getItem("session_id"), }),
      });

        // console.log("📶 API Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`❌ Failed to get chatbot response: ${response.statusText}, Response: ${errorText}`);
        }

        const data = await response.json();
        // console.log("🤖 Chatbot Response:", data);

        if (data.session_id && data.session_id !== sessionId) {
          setSessionId(data.session_id);
          localStorage.setItem("session_id", data.session_id);
      }

        // if (data.session_id) {
        //   //  console.log("💾 Updating Session ID:", data.session_id);
        //    localStorage.setItem("session_id", data.session_id);
        //    setSelectedSessionId(data.session_id); 
        // }

        if (!data || !data.response) {
            throw new Error("Invalid response format from API");
        }

        setTyping(false);
        const botMessage = { text: data.response, sender: "bot" };
        setMessages((prev) => Array.isArray(prev) ? [...prev, botMessage] : [botMessage]);
        setLastSender("bot");

        if (!isLoggedIn) {
            sessionStorage.setItem("guestChat", JSON.stringify([...messages, newMessage, botMessage]));
        } else {
            // ✅ Manually update chat history without waiting for API
            setChatHistory((prev) => ({
              ...prev,
              [sessionId]: [
                ...(prev[sessionId] || []),
                { sender: "user", message: input },
                { sender: "bot", message: data.response }
              ]
            }));
        }

    } catch (error) {
        console.error("Error fetching chatbot response:", error);
        setTyping(false);
    }

};


  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("guestChat"); // Remove temporary chat
    setIsLoggedIn(false);
    setChatHistory([]);
    setMessages([]); // Clear messages on logout
    navigate("/");
    setTimeout(() => window.location.reload(), 100);  // 🔄 force refresh
};


const loadChat = (sessionId) => {
  setSelectedSessionId(sessionId); // for highlighting if needed
  const chatData = chatHistory[sessionId];

  if (!Array.isArray(chatData)) {
    console.warn("Invalid chat format for this session:", sessionId);
    return;
  }

  const formatted = chatData.map(msg => ({
    text: msg.message,
    sender: msg.sender
  }));

  setIsHistoryLoad(true);
  setMessages(formatted);
};


  return (
    <div className="chat-body"> 

      
      {/* Logout button if user is logged in */}
      {isLoggedIn && (
          <button className="login-btn" onClick={() => {
            handleLogout();
          }}>
            Logout
          </button>
        )}
      <div className="top-buttons">
        {/* 🆕 New Chat Button */}
        {isLoggedIn && (
            <button className="new-chat-btn" onClick={startNewChat}>New Chat</button>
          )}
        <div className="chat-container">
          <h1 className="chat-heading">Your Assistant</h1>
          
          <div className="chat-box" ref={chatBoxRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <span className="sender-label">{msg.sender === "user" ? "Me: " : "Assistant: "}</span>
                {msg.sender === "bot" ? <MarkdownRenderer text={msg.text} /> : <p>{msg.text}</p>}
              </div>
            ))}
            {typing && <div className="typing">Assistant is responding...</div>}
          </div>
          <div className="input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>

      </div>
      

      

      <div className="button-group">
        {isLoggedIn && (
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}  tabIndex="0" ref={toggleBtnRef}
          onKeyDown={(e) => e.key === "Enter" && setSidebarOpen(!sidebarOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        
        
      </div>

      {isLoggedIn && (
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}  ref={sidebarRef}>
          
          <h2>Chat History</h2>
          <ul>
            {Object.entries(chatHistory).reverse().map(([sessionId, messages], index) => {
              // Find the first user message (if any)
             const firstUserMessage = messages?.find(msg => msg.sender === "user");

              return (
                <li
                  key={sessionId}
                  onClick={() => loadChat(sessionId)}
                 style={{
                   cursor: "pointer",
                   padding: "8px 12px",
                   marginBottom: "4px",
                   borderRadius: "4px",
                   backgroundColor: sessionId === selectedSessionId ? "#0a1f44" : "transparent",
                   fontWeight: sessionId === selectedSessionId ? "bold" : "normal",
                 }}
               >
                  🗂 {firstUserMessage ? `"${firstUserMessage.message.slice(0, 25)}"` : `Session ${index + 1}`}
                </li>
             );
           })}
          </ul>
        </div>
      )}

      {showLoginModal && <Login onLogin={() => { setIsLoggedIn(true); setShowLoginModal(false); fetchChatHistory(); }} />}
    </div>
  );
};

export default Chatbot;


