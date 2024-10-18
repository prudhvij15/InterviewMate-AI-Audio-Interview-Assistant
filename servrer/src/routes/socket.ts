import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import axios from "axios";
import FormData from "form-data";

const OPENAI_API_KEY = process.env.API_KEY;

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
        // Step 1: Transcribe the audio to text
        const transcription = await transcribeAudio(audioBlob);
        console.log("Transcribed Text:", transcription);

        // Step 2: Send the transcribed text to OpenAI for a response
        const response = await getOpenAIResponse(transcription);
        console.log("OpenAI Response:", response);

        socket.emit("interviewResponse", response);
      } catch (error) {
        console.error("Error:", error);
        socket.emit(
          "transcriptionError",
          "An error occurred during processing."
        );
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
  formData.append("model", "whisper-1");

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

  return response.data.text;
};

const getOpenAIResponse = async (question: string) => {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
};

export default setupSocketIO;
