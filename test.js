console.log("Testing node-fetch...");
const fetch = require("node-fetch");
console.log("node-fetch imported successfully");

console.log("Testing express...");
const express = require("express");
console.log("Express imported successfully");

const app = express();
app.listen(5000, () => {
  console.log("Minimal server running");
  setInterval(() => console.log("Still alive..."), 5000);
});
