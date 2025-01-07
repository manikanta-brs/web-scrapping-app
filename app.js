const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); // or "assets"

// Fallback data
const fallbackData = JSON.parse(fs.readFileSync("data.json"));

app.get("/", async (req, res) => {
  const amazonURL =
    "https://www.amazon.in/gp/browse.html?node=4092115031&ref_=nav_em_sbc_tvelec_gaming_consoles_0_2_9_12";

  try {
    // Fetch the HTML from the URL using Axios
    const { data } = await axios.get(amazonURL, {
      headers: { "User-Agent": "Mozilla/5.0 ..." },
    });

    // Load the HTML using Cheerio
    const $ = cheerio.load(data);

    const items = [];
    $(".octopus-pc-item").each((index, element) => {
      const title = $(element).find(".octopus-pc-asin-title").text().trim();
      const price = $(element).find(".a-price .a-offscreen").text().trim();
      const imageURL = $(element).find("img").attr("src");

      if (title && price && imageURL) {
        items.push({ title, price, imageURL });
      }
    });

    // If no items are found, use fallback data from data.json
    if (items.length === 0) {
      console.log("No items found, using fallback data.");
      items.push(...fallbackData);
    }

    // Render the data to the view
    res.render("index", { data: items });
  } catch (error) {
    console.error("Error scraping the website:", error);
    res.status(500).send("Error scraping the website.");
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
