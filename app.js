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
    // Launch Puppeteer browser with options to enhance compatibility
    const browser = await puppeteer.launch({
      headless: true, // Run in headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Add for better compatibility in some hosting services
    });

    const page = await browser.newPage();

    // Set User-Agent to mimic a real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
    );

    // Navigate to the Amazon page
    await page.goto(amazonURL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Extract the product data using Puppeteer
    const items = await page.evaluate(() => {
      const products = [];
      const productElements = document.querySelectorAll(
        ".a-section.octopus-pc-card-content .a-list-item"
      );

      productElements.forEach((product) => {
        const title = product.querySelector(".octopus-pc-asin-title")
          ? product.querySelector(".octopus-pc-asin-title").innerText.trim()
          : "";
        const price = product.querySelector(".a-price .a-offscreen")
          ? product.querySelector(".a-price .a-offscreen").innerText.trim()
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

    // Check if any items were scraped
    if (items.length === 0) {
      throw new Error(
        "No products found. The website structure might have changed."
      );
    }

    // Render the data to the view
    res.render("index", { data: items });
  } catch (error) {
    console.error("Error scraping the website:", error.message);
    res.status(500).send("An error occurred while scraping the website.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
