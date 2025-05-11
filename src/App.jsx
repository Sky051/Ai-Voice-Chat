import React, { useState, useEffect, useRef } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const gemininAPIResponse = async (query) => {
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCt5hrWV0REk2tZwa3b3NpZAk4Rmta7Xrg`;
    const body = {
      contents: [
        {
          parts: [
            {
              text: query,
            },
          ],
        },
      ],
    };
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      let errorMessage = `Gemini API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData?.error?.message || (await response.text())}`;
      } catch (e) {
        errorMessage += ` - ${(await response.text())}`;
      }
      console.error('Gemini API error:', response.status, errorMessage);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini AI';
    return generatedText;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return `Error: ${error.message}`;
  }
};

export default function App() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      alert('Speech Recognition API not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      handleQuery(speechToText);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setTranscript('');
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleQuery = async (query) => {
    if (!query.trim()) return;
    setChat((prev) => [...prev, { sender: 'user', text: query }]);
    setLoading(true);
    const response = await gemininAPIResponse(query);
    setChat((prev) => [...prev, { sender: 'ai', text: response }]);
    setLoading(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleQuery(manualInput);
    setManualInput('');
  };

  return (
    <div className="max-w-xl mx-auto font-sans flex flex-col h-[90vh] p-4">
      <h1 className="text-center text-2xl font-bold mb-4">Voice AI Chat</h1>
      <div
        ref={chatContainerRef}
        className="flex-1 border border-gray-300 rounded-md p-4 overflow-y-auto flex flex-col gap-3 mb-4"
      >
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[70%] rounded-2xl p-3 ${
              msg.sender === 'user' ? 'self-end bg-green-200' : 'self-start bg-gray-200'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="italic text-gray-500 self-center">AI is typing...</div>}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={listening ? stopListening : startListening}
          className={`text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl ${
            listening ? 'bg-red-500' : 'bg-green-600'
          }`}
          aria-label={listening ? 'Stop recording' : 'Start recording'}
        >
          {listening ? '🛑' : '🎤'}
        </button>
        <form onSubmit={handleManualSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type your message"
            className="flex-1 border border-gray-300 rounded-md p-2 text-base"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}