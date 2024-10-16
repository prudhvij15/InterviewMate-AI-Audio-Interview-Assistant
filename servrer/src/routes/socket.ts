import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import WebSocket from "ws";

const REGION = "us-west-2";
const LANGUAGE_CODE = "en-US";
const SAMPLE_RATE = 16000;

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
      console.log("Received audio data:", audioBlob);

      const transcribeUrl = generateTranscribeWebSocketUrl();
      console.log("Generated WebSocket URL:", transcribeUrl);

      const transcribeSocket = new WebSocket(transcribeUrl);

      let fragmentedMessage = "";

      transcribeSocket.on("open", () => {
        console.log("Connected to Amazon Transcribe WebSocket");

        const sendAudioData = () => {
          if (audioBlob.length > 0) {
            const chunk = audioBlob.slice(0, 4096);
            transcribeSocket.send(chunk);
            audioBlob = audioBlob.slice(4096);

            setTimeout(sendAudioData, 100);
          } else {
            transcribeSocket.close();
          }
        };

        sendAudioData();
      });

      transcribeSocket.on("message", (message) => {
        console.log("Received message from Transcribe WebSocket:", message);
        console.log("Raw message buffer:", message.toString("hex"));
        if (message instanceof Buffer) {
          const messageString = message.toString("utf8");
          fragmentedMessage += messageString;

          if (fragmentedMessage.endsWith("\n")) {
            const messageStringComplete = fragmentedMessage;
            fragmentedMessage = "";

            const jsonString = messageStringComplete.replace(/^.*\n\n/, "");
            const trimmedJsonString = jsonString.replace(
              /[\x00-\x1F\x7F]/g,
              ""
            );

            try {
              const transcriptionResult: any = JSON.parse(trimmedJsonString);
              console.log("Transcription Result:", transcriptionResult);

              if (transcriptionResult.Transcript) {
                const transcript = transcriptionResult.Transcript.Results.map(
                  (result: any) => result.Alternatives[0].Transcript
                ).join(" ");
                console.log("Transcribed Text:", transcript);
                // Emit the transcribed text back to the client if needed
                socket.emit("transcriptionResult", transcript);
              }
            } catch (error) {
              console.error("Failed to parse transcription result:", error);
            }
          }
        }
      });

      transcribeSocket.on("close", (code, reason) => {
        console.log(
          `Transcribe WebSocket connection closed with code: ${code}, reason: ${reason}`
        );
      });

      transcribeSocket.on("error", (error) => {
        console.error("Amazon Transcribe WebSocket error:", error);
      });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};

const generateTranscribeWebSocketUrl = () => {
  const queryParams = new URLSearchParams({
    "language-code": LANGUAGE_CODE,
    "media-encoding": "pcm", // Ensure this matches your audio format
    "sample-rate": SAMPLE_RATE.toString(),
  });

  const transcribeUrl = `wss://transcribestreaming.${REGION}.amazonaws.com:8443/stream-transcription-websocket?${queryParams.toString()}`;
  return transcribeUrl;
};

export default setupSocketIO;
