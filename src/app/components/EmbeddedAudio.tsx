// components/FormWidget.tsx
"use client";
import { useState } from "react";
import Recorder from "recorder-js";
import axios from "axios";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
const EmbeddedAudio: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recorder, setRecorder] = useState<Recorder | null>(null);
  const [error, setError] = useState<string>("");


  const base64ToUint8Array = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handlePlay = async (res) => {
    try {
      const base64Data = res.data;
      // Decode Base64 string to binary data

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.decodeAudioData(base64ToUint8Array(base64Data), function (decodedData) {
        const source = audioContext.createBufferSource();
        source.buffer = decodedData;
        source.connect(audioContext.destination);
        source.start();
      });
    } catch (error) {
      console.error("There was an error playing the audio!", error);
    }
  };

  const handleAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const newRecorder = new Recorder(audioContext);
      await newRecorder.init(stream);
      setRecorder(newRecorder);
    } catch (err) {
      setError("Could not access microphone");
    }
  };

  const startRecording = () => {
    if (recorder) {
      recorder.start();
    }
  };

  const stopRecording = async () => {
    if (recorder) {
      const { blob } = await recorder.stop();
      console.log(blob);
      setAudioBlob(blob);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !audioBlob) {
      setError("All fields are required");
      return;
    }
    console.log(audioBlob);
    
    const url2 = window.URL.createObjectURL(audioBlob);
    const link2 = document.createElement("a");
    link2.href = url2;
    link2.setAttribute("download", "input_voice.wav");
    document.body.appendChild(link2);
    link2.click();
    window.URL.revokeObjectURL(url2);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("audio", audioBlob, "audio.wav");

    console.log("Submitting form data", formData);
    const res = await axios.post(
      "http://127.0.0.1:5000/process_audio",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log(res);
    handlePlay(res);
    

    if (true) {
      setName("");
      setEmail("");
      setAudioBlob(null);
      setError("");
      alert("Form submitted successfully");
    } else {
      setError("Failed to submit the form");
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Submit Your Info</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded text-black"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded text-black"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Audio Stream</label>
          <button
            type="button"
            onClick={handleAudioStream}
            className="w-full px-3 py-2 border rounded bg-blue-500 text-white"
          >
            {recorder ? "Microphone Access Granted" : "Allow Microphone Access"}
          </button>
          {recorder && (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="w-full px-3 py-2 border rounded bg-green-500 text-white mt-2"
              >
                Start Recording
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="w-full px-3 py-2 border rounded bg-red-500 text-white mt-2"
              >
                Stop Recording
              </button>
            </>
          )}
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full px-3 py-2 bg-green-500 text-white rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default EmbeddedAudio;
