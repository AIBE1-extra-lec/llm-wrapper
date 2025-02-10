require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post("/", async (req, res) => {
  const { TOGETHER_API_KEY } = process.env;
  const { GROQ_API_KEY } = process.env;
  const TOGETHER_URL = "https://api.together.xyz";
  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  const TURBO_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
  const FLUX_MODEL = "black-forest-labs/FLUX.1-schnell-Free";
  const MIXTRAL_MODEL = "mixtral-8x7b-32768";
  const DEEPSEEK_MODEL = "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free";

  async function callAI({
    url,
    model,
    text,
    textImg,
    api_key,
    jsonMode = false,
    max_tokens,
  }) {
    const payload = {
      model,
    };
    if (max_tokens) {
      payload.max_tokens = max_tokens;
    }
    if (text) {
      payload.messages = [
        {
          role: "user",
          content: text,
        },
      ];
    }
    if (textImg) {
      payload.prompt = textImg;
    }
    if (jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${api_key}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
  const { text } = req.body;

  const prompt = await callAI({
    url: `${TOGETHER_URL}/v1/chat/completions`,
    model: TURBO_MODEL,
    text: `${text}를 바탕으로 맛집 추천에 어울리는 AI 이미지 생성을 위한 200자 이내의 영어 프롬프트를 작성해줘`,
    api_key: TOGETHER_API_KEY,
  }).then((res) => res.choices[0].message.content);

  const promptJSON = await callAI({
    url: GROQ_URL,
    model: MIXTRAL_MODEL,
    text: `${prompt}에서 AI 이미지 생성을 위해 작성된 200자 이내의 영어 프롬프트를 JSON Object로 prompt라는 key로 JSON string으로 output해줘`,
    api_key: GROQ_API_KEY,
    jsonMode: true,
  }).then((res) => JSON.parse(res.choices[0].message.content).prompt);

  const image = await callAI({
    url: `${TOGETHER_URL}/v1/images/generations`,
    model: FLUX_MODEL,
    textImg: promptJSON,
    api_key: TOGETHER_API_KEY,
  }).then((res) => res.data[0].url);

  const promptDes = await callAI({
    url: `${TOGETHER_URL}/v1/chat/completions`,
    model: TURBO_MODEL,
    text: `${text}를 바탕으로 맛집 추천에 어울리는 설명 생성을 위한 200자 이내의 한글 프롬프트 작성해줘`,
    api_key: TOGETHER_API_KEY,
  }).then((res) => res.choices[0].message.content);

  const promptDesJSON = await callAI({
    url: GROQ_URL,
    model: MIXTRAL_MODEL,
    text: `${promptDes}에서 reasoning을 위해 작성된 200자 이내의 한글 프롬프트를 JSON Object로 prompt라는 key로 JSON string으로 output해줘`,
    api_key: GROQ_API_KEY,
    jsonMode: true,
  }).then((res) => JSON.parse(res.choices[0].message.content).prompt);

  const desc = await callAI({
    url: `${TOGETHER_URL}/v1/chat/completions`,
    model: DEEPSEEK_MODEL,
    text: promptDesJSON,
    api_key: TOGETHER_API_KEY,
    max_tokens: 2048,
  }).then((res) => res.choices[0].message.content.split("</think>")[1]);

  //   console.log(image);
  //   desc = JSON.stringify(promptJSON);
  res.json({
    image,
    desc,
  });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
