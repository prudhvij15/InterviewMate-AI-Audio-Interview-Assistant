import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import axios from "axios";
import FormData from "form-data";

const OPENAI_API_KEY = "OPEN AI API KEY";

const setupSocketIO = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("audioData", async (audioBlob: Buffer) => {
      console.log("Received audio data");

      try {
        const transcription = await transcribeAudio(audioBlob);
        console.log("Transcribed Text:", transcription);
        // Emit the transcribed text back to the client if needed
        socket.emit("transcriptionResult", transcription);
      } catch (error) {
        console.error("Error transcribing audio:", error);
        socket.emit("transcriptionError", "Failed to transcribe audio.");
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};

const transcribeAudio = async (audioBlob: Buffer) => {
  const formData = new FormData();
  formData.append("file", audioBlob, {
    filename: "audio.wav",
    contentType: "audio/wav",
  });
  formData.append("model", "whisper-1"); // Use the correct model for transcription

  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    formData,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    }
  );

  return response.data.text; // Extract the transcribed text from the response
};

export default setupSocketIO;
