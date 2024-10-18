import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

const AudioRecorder: React.FC = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<
    { question: string; response: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string>("");

  useEffect(() => {
    const initMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // Send audio data to the server
            socket.emit("audioData", event.data);

            setLastQuestion("What is your question?"); // Set your actual question here
          }
        };

        recorder.onstart = () => {
          console.log("Recording started");
        };

        recorder.onstop = () => {
          console.log("Recording stopped");
        };

        setMediaRecorder(recorder);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setError("Error accessing microphone. Please check your permissions.");
      }
    };

    initMediaRecorder();

    // Clean up function to stop tracks
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    socket.on("interviewResponse", (response) => {
      console.log("Received response from server:", response);
      // Use the lastQuestion for conversation
      setConversation((prev) => [
        ...prev,
        { question: lastQuestion, response },
      ]);
    });

    socket.on("transcriptionError", (error) => {
      console.error("Transcription error:", error);
      setError("An error occurred during transcription.");
    });

    return () => {
      socket.off("interviewResponse");
      socket.off("transcriptionError");
    };
  }, [lastQuestion]);

  const startRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.start();
      setIsRecording(true);
      setConversation([]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="container mx-auto p-6 border border-gray-300 rounded-lg bg-gray-50 shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Audio Interview Recorder
      </h2>
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors duration-300 ${
            isRecording
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors duration-300 ${
            !isRecording
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Stop Recording
        </button>
      </div>

      <div className="border-t border-gray-300 pt-4 w-full">
        <h3 className="text-lg font-semibold text-center">Conversation:</h3>
        <div className="mt-4">
          {conversation.map((item, index) => (
            <div key={index} className="mb-6 text-left">
              {/* <p className="font-bold">Question:</p> */}
              <p className="pl-4 bg-gray-500">
                {item.question.split("\n").map((line, i) => (
                  <span key={i} className="bg-gray-700">
                    {line}
                    <br />
                  </span>
                ))}
              </p>

              <p className="pl-4">
                {/* <p className="font-bold mt-2">Answer:</p> */}
                {item.response.split("\n").map((line, i) => (
                  <span key={i} className="">
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-600 font-bold text-center">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
