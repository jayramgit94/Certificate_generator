const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mailjet = require("node-mailjet");

const app = express();
const port = process.env.PORT || 3000;

// Setup CORS (optional but good for frontend)
app.use(cors());

// Serve static files (your HTML, JS, etc.)
app.use(express.static("public"));

// Setup Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure Mailjet
const mailjetClient = mailjet.apiConnect(
  "470a1bc478310ddccf17d4e69afa3054",
  "4fdb685a68a0664d3305567054684003"
);

// Endpoint to send email
app.post("/send-email", upload.single("certificate"), async (req, res) => {
  const { name, email } = req.body;
  const certificateBuffer = req.file.buffer;

  try {
    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "sangawatjayram@gmail.com",
            Name: "Certificate Generator",
          },
          To: [
            {
              Email: email,
              Name: name,
            },
          ],
          Subject: "Your Certificate",
          TextPart: "Congratulations! Please find your certificate attached.",
          Attachments: [
            {
              ContentType: "image/png",
              Filename: `${name}_certificate.png`,
              Base64Content: certificateBuffer.toString("base64"),
            },
          ],
        },
      ],
    });

    await request;

    res.json({ success: true, message: `Email sent to ${email}` });
  } catch (error) {
    console.error(
      "Mailjet Error:",
      error.statusCode,
      error.response?.body || error.message
    );
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
