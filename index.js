const fs = require("fs");
const express = require("express");
const app = express();

const port = 65515;

app.use(express.static("public"));
app.use((req, res, next) => {
  res.renderHTML = (file) => {
    if (!file.endsWith(".html")) {
      file += ".html";
    }

    res.sendFile(file, {root: "./views"});
  }

  next();
});

app.get("/", (req, res) => {
  res.renderHTML("index");
});

app.listen(port, () => {
  console.clear();
  console.log("Listening on port %s", port);
});