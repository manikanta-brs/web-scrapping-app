const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));

// Define the route for scraping and rendering data
app.get("/", async (req, res) => {
  const amazonURL =
    "https://www.amazon.in/gp/browse.html?node=4092115031&ref_=nav_em_sbc_tvelec_gaming_consoles_0_2_9_12";

  try {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the Amazon page
    await page.goto(amazonURL, { waitUntil: "domcontentloaded" });

    // Extract the product data using Puppeteer
    const items = await page.evaluate(() => {
      const products = [];
      const productElements = document.querySelectorAll(
        ".a-section.octopus-pc-card-content .a-list-item"
      );

      productElements.forEach((product) => {
        const title = product.querySelector(".octopus-pc-asin-title")
          ? product.querySelector(".octopus-pc-asin-title").innerText
          : "";
        const price = product.querySelector(".a-price .a-offscreen")
          ? product.querySelector(".a-price .a-offscreen").innerText
          : "";
        const imageURL = product.querySelector("img")
          ? product.querySelector("img").src
          : "";

        if (title && price && imageURL) {
          products.push({ title, price, imageURL });
        }
      });

      return products;
    });

    // Close the browser
    await browser.close();

    // Render the data to the view
    res.render("index", { data: items });
  } catch (error) {
    console.error("Error scraping the website:", error);
    res.status(500).send("Error scraping the website.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
