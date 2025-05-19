import React, { useEffect, useRef, useState } from "react";
import MonacoEditor from "react-monaco-editor";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import axios from "axios";

const App = () => {
  const [code, setCode] = useState('print("Hello, World!")');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const terminalRef = useRef(null);
  const term = useRef(null);

  // Initialize terminal
  useEffect(() => {
    if (!term.current) {
      term.current = new Terminal({
        convertEol: true,
        fontSize: 14,
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
        },
      });
      term.current.open(terminalRef.current);
      term.current.writeln("🧑‍💻 Mini Python IDE Ready!");
    }

    // Check backend connection on first load
    checkBackendConnection();
  }, []);

  // Function to write to terminal
  const printToTerminal = (text, isError = false) => {
    const lines = text.split("\n");
    lines.forEach((line) => {
      if (isError) {
        term.current.writeln(`\x1b[31m⚠️ ${line}\x1b[0m`);
      } else {
        term.current.writeln(line);
      }
    });
    term.current.scrollToBottom();
  };

  // Ping backend to check connection
  const checkBackendConnection = async () => {
    try {
      const res = await axios.get("http://localhost:5000/ping");
      if (res.status === 200) {
        setConnected(true);
        term.current.writeln("✅ Connected to backend.");
      }
    } catch {
      setConnected(false);
      term.current.writeln("❌ Backend not reachable. Please start the server.");
    }
  };

  // Run code with backend call
// Replace handleRun with this fixed version
const handleRun = async () => {
  if (!connected) {
    printToTerminal("❌ Backend connection not available. Cannot run code.", true);
    return;
  }

  setLoading(true);
  printToTerminal("⏳ Running your code...");

  try {
    const res = await axios.post("http://localhost:5000/execute", {
      code,
      input,
    });

    if (res.data.stdout) {
      printToTerminal("✅ Output:\n" + res.data.stdout);
    } else {
      printToTerminal("⚠️ No output received.");
    }

    if (res.data.stderr) {
      printToTerminal("⚠️ Error:\n" + res.data.stderr, true);
    }
  } catch (error) {
    printToTerminal("❌ Error running code.", true);
    printToTerminal(error.message, true);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Mini Python Code Editor 🐍</h2>
      <MonacoEditor
        height="300"
        language="python"
        theme="vs-dark"
        value={code}
        onChange={(newCode) => setCode(newCode)}
        options={{ fontSize: 16 }}
      />
      <textarea
        placeholder="Enter input here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", marginTop: "10px", padding: "8px" }}
      />
      <button
        onClick={handleRun}
        disabled={loading}
        style={{ marginTop: "10px", padding: "10px" }}
      >
        {loading ? "⏳ Running..." : "▶️ Run Code"}
      </button>
      <div
        ref={terminalRef}
        style={{
          marginTop: "20px",
          height: "200px",
          backgroundColor: "#1e1e1e",
          padding: "10px",
          overflow: "auto",
        }}
      />
    </div>
  );
};

export default App;
