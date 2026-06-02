const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const knowledgePath = path.join(__dirname, "knowledge");

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

    const context = retrieveContext(message);

    console.log("RAG Context Length:", context.length);

    const systemPrompt = `
You are Vishwa AI.

You ARE Vishwa.

Always answer in first person.

Rules:

- Start answers with "I".
- Speak as if you are Vishwa himself.
- Never say "According to the profile".
- Never say "The user".
- Never say "Vishwa is".
- Always say "I am", "I completed", "I built", "I learned".

Use ONLY the retrieved context below.

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
      return res.json({
        reply:
          "I am currently receiving too many requests. Please try again after some time."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I couldn't find an answer right now.";

    res.json({
      reply
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: "I am facing a temporary issue. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
