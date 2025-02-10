require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const axios = require("axios");

app.use(cors());
app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

app.post("/", async (req, res) => {
  const { text } = req.body;
  const { TOGETHER_API_KEY } = process.env;
  const url = "https://api.together.xyz/v1/chat/completions";
  const model = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
  const api_key = TOGETHER_API_KEY;
  const response = await axios.post(
    url,
    {
      model,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${api_key}`,
        "Content-Type": "application/json",
      },
    }
  );
  res.json({ data: response.data });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
