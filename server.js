const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const knowledgePath = __dirname;

function loadKnowledge() {
  const knowledge = {};

  const files = fs.readdirSync(knowledgePath);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const data = JSON.parse(
        fs.readFileSync(path.join(knowledgePath, file), "utf8")
      );

      knowledge[file.replace(".json", "")] = data;
    }
  }

  return knowledge;
}

const knowledgeBase = loadKnowledge();

app.get("/", (req, res) => {
  res.send("Vishwa Real RAG Backend Running 🚀");
});

function retrieveContext(question) {
  const q = question.toLowerCase();

  const chunks = [];

  if (
    q.includes("food") ||
    q.includes("cricketer") ||
    q.includes("actor") ||
    q.includes("movie") ||
    q.includes("color") ||
    q.includes("god")
  ) {
    chunks.push(knowledgeBase.favorites);
  }

  if (
    q.includes("mother") ||
    q.includes("father") ||
    q.includes("family") ||
    q.includes("brother") ||
    q.includes("sister") ||
    q.includes("siblings")
  ) {
    chunks.push(knowledgeBase.family);
  }

  if (
    q.includes("school") ||
    q.includes("college") ||
    q.includes("education") ||
    q.includes("cgpa") ||
    q.includes("nxtwave")
  ) {
    chunks.push(knowledgeBase.education);
  }

  if (
    q.includes("project") ||
    q.includes("chatbot") ||
    q.includes("app")
  ) {
    chunks.push(knowledgeBase.projects);
  }

  if (
    q.includes("skill") ||
    q.includes("technology") ||
    q.includes("react") ||
    q.includes("node") ||
    q.includes("python")
  ) {
    chunks.push(knowledgeBase.skills);
  }

  if (
    q.includes("achievement") ||
    q.includes("award") ||
    q.includes("hackathon")
  ) {
    chunks.push(knowledgeBase.achievements);
  }

  if (
    q.includes("challenge")
  ) {
    chunks.push(knowledgeBase.challenges);
  }

  if (
    q.includes("lesson")
  ) {
    chunks.push(knowledgeBase.lessons);
  }

  if (
    q.includes("hobby") ||
    q.includes("cricket") ||
    q.includes("mahabharata")
  ) {
    chunks.push(knowledgeBase.hobbies);
  }

  if (
    q.includes("strength") ||
    q.includes("weakness") ||
    q.includes("trait")
  ) {
    chunks.push(knowledgeBase.personal_traits);
  }

  if (
    q.includes("goal") ||
    q.includes("career") ||
    q.includes("salary")
  ) {
    chunks.push(knowledgeBase.career_preferences);
  }

  if (
    q.includes("introduce") ||
    q.includes("yourself") ||
    q.includes("self intro")
  ) {
    chunks.push(knowledgeBase.self_introduction);
  }

  if (chunks.length === 0) {
    chunks.push(
      knowledgeBase.profile,
      knowledgeBase.self_introduction
    );
  }

  return JSON.stringify(chunks, null, 2);
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "I need a question to answer."
      });
    }

    const lowerMessage = message.toLowerCase().trim();

    const greetings = [
      "hi", "hello", "hey", 
      "hi vishwa", "hello vishwa", "hey vishwa", 
      "good morning", "good afternoon", "good evening", "good night", 
      "how are you", "how are you vishwa"
    ];

    const fallbacks = [
      "thanks", "thank you", 
      "ok", "okay", 
      "bye", "see you"
    ];

    if (greetings.includes(lowerMessage)) {
      console.log("=================================");
      console.log(`USER: ${message}`);
      console.log("GREETING DETECTED");
      console.log("NO LLM CALL");

      let reply = "Hi 👋 Nice to meet you!";

      if (lowerMessage.includes("good morning")) reply = "Good morning ☀️ Have a wonderful day!";
      else if (lowerMessage.includes("good afternoon")) reply = "Good afternoon ☀️ Hope you're having a great day!";
      else if (lowerMessage.includes("good evening")) reply = "Good evening 🌆 Wishing you a pleasant evening!";
      else if (lowerMessage.includes("good night")) reply = "Good night 🌙 Take care!";
      else if (lowerMessage.includes("how are you")) reply = "I am doing well, thank you for asking 😊";
      else if (lowerMessage.startsWith("hi") || lowerMessage.startsWith("hello") || lowerMessage.startsWith("hey")) {
        reply = "Hello 👋 How are you?";
      }

      console.log("REPLY SENT");
      console.log("==========");

      return res.json({ reply });
    }

    if (fallbacks.includes(lowerMessage)) {
      console.log("=================================");
      console.log(`USER: ${message}`);
      console.log("GREETING DETECTED");
      console.log("NO LLM CALL");

      let reply = "You're welcome 😊";
      
      if (lowerMessage === "bye" || lowerMessage === "see you") {
        reply = "Bye 👋 Have a great day!";
      }

      console.log("REPLY SENT");
      console.log("==========");

      return res.json({ reply });
    }

    console.log("=================================");
    console.log(`USER: ${message}`);

    const context = retrieveContext(message);

    console.log(`RAG Context Length: ${context.length}`);

    const systemPrompt = `
You ARE Vishwa Jaganathan.

Strict Rules:
- Always answer in first person.
- Start answers naturally with "I".
- Speak like a human, not like an AI assistant.
- Keep answers short and conversational.
- Do not give long theoretical explanations.
- For simple questions answer in 1–3 sentences.
- Only provide long answers when the user explicitly asks for details.
- Never say "According to the profile".
- Never say "The user".
- Never say "Vishwa is".
- Always say "I am", "I completed", "I built", "I learned".
- Use the retrieved context only.

Retrieved Context:
 ${context}
`;

    const response = await fetch(
      "https://api.sambanova.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Llama-4-Maverick-17B-128E-Instruct",
          temperature: 0.1,
          top_p: 0.1,
          max_tokens: 120,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (data?.error?.type === "rate_limit_exceeded") {
      console.log("RATE LIMIT DETECTED");
      console.log("REPLY SENT");
      console.log("==========");
      
      return res.json({
        reply:
          "I am currently receiving too many requests. Please try again after some time."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I couldn't find an answer right now.";

    console.log("SAMBANOVA CALLED");
    console.log("REPLY SENT");
    console.log("==========");

    res.json({
      reply
    });

  } catch (error) {
    console.log("=================================");
    console.log("ERROR DETECTED");
    console.log(`ERROR MESSAGE: ${error.message}`);
    console.log("==================");

    res.status(500).json({
      reply: "I am facing a temporary issue. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
