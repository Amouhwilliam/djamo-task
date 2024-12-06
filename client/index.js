const express = require("express");
const axios = require("axios");
const { randomUUID } = require("crypto");

const app = express();
app.use(express.json());

const port = process.env.PORT || 3100;
const yourApiUrl = process.env.YOUR_API || "http://localhost:3200";

app.post("/transaction", (_, res) => {
  const body = { id: randomUUID() };
  console.log(`Request transaction creation with id = ${body.id}`);
  axios
    .post(`${yourApiUrl}/transaction`, body)
    .then((yourResponse) => {
      const { id, status } = yourResponse.data;
      console.log(`Transaction ${id} is ${status}`);
    })
    .catch((e) => console.log("Error while calling your api", e));
  res.send();
});

app.put("/transaction", (req, res) => {
  const { id, status } = req.body.status;
  console.log(`Transaction ${id} marked as ${status}`);
  res.send();
});

app.listen(port, () => {
  console.log(`Client mock is listening on port ${port}`);
});
