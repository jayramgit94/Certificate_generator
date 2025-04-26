let users = [];
let currentIndex = 0;

const canvas = document.getElementById("certificateCanvas");
const ctx = canvas.getContext("2d");

// PDF.js configuration
const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

let pdfDoc = null;

// Load the certificate template
const pdfPath = "./assets/certificate2.pdf";
pdfjsLib.getDocument(pdfPath).promise.then((pdf) => {
  pdfDoc = pdf;
  fetchUserData();
});

// Render PDF Page
function renderPDFPage(pageNumber, callback) {
  pdfDoc.getPage(pageNumber).then((page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    page.render(renderContext).promise.then(callback);
  });
}

// Fetch User Data
function fetchUserData() {
  fetch("/data/users.json")
    .then((res) => res.json())
    .then((data) => {
      users = data;
      if (users.length > 0) drawCertificate(users[currentIndex]);
    })
    .catch((err) => console.error("Error loading user data:", err));
}

// Draw Certificate with User Data
function drawCertificate(user) {
  renderPDFPage(1, () => {
    ctx.fillStyle = "#000";
    ctx.font = "50px Georgia";
    ctx.textAlign = "center";

    const nameY = canvas.height / 2 + 20;
    ctx.fillText(user.name, canvas.width / 2, nameY);

    document.getElementById("recipientName").value = user.name || "";
    document.getElementById("recipientEmail").value = user.email || "";
  });
}

// Generate a Single Certificate
function generateCertificate(user, callback) {
  renderPDFPage(1, () => {
    ctx.fillStyle = "#000";
    ctx.font = "50px Georgia";
    ctx.textAlign = "center";

    const nameY = canvas.height / 2 + 20;
    ctx.fillText(user.name, canvas.width / 2, nameY);

    canvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${user.name}_certificate.png`;
      link.click();
      if (callback) callback();
    }, "image/png");
  });
}

// Previous Button
document.getElementById("prevBtn")?.addEventListener("click", () => {
  if (users.length === 0) return;
  currentIndex = (currentIndex - 1 + users.length) % users.length;
  drawCertificate(users[currentIndex]);
});

// Next Button
document.getElementById("nextBtn")?.addEventListener("click", () => {
  if (users.length === 0) return;
  currentIndex = (currentIndex + 1) % users.length;
  drawCertificate(users[currentIndex]);
});

// Download Current Certificate
document.getElementById("downloadBtn")?.addEventListener("click", () => {
  if (users.length === 0) return;
  generateCertificate(users[currentIndex]);
});

// Download All Certificates
document.getElementById("downloadAllBtn")?.addEventListener("click", () => {
  if (users.length === 0) return;

  let i = 0;

  function generateNext() {
    if (i >= users.length) return;
    generateCertificate(users[i], () => {
      i++;
      setTimeout(generateNext, 300); // slight delay
    });
  }

  generateNext();
});

// Send All Certificates by Email
document.getElementById("sendAllBtn")?.addEventListener("click", () => {
  if (users.length === 0) {
    alert("No users available to send certificates.");
    return;
  }

  let i = 0;

  function sendNext() {
    if (i >= users.length) {
      alert("✅ Certificates sent to all users!");
      return;
    }

    const user = users[i];
    renderPDFPage(1, () => {
      ctx.fillStyle = "#000";
      ctx.font = "50px Georgia";
      ctx.textAlign = "center";

      const nameY = canvas.height / 2 + 20;
      ctx.fillText(user.name, canvas.width / 2, nameY);

      canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("name", user.name);
        formData.append("email", user.email);
        formData.append("certificate", blob, `${user.name}_certificate.png`);

        fetch("/send-email", {
          method: "POST",
          body: formData,
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to send email to ${user.email}`);
            }
            return res.json();
          })
          .then(() => {
            console.log(`✅ Email sent to ${user.email}`);
            i++;
            setTimeout(sendNext, 500); // Delay to avoid overwhelming the server
          })
          .catch((err) => {
            console.error(`❌ Failed to send email to ${user.email}:`, err);
            i++;
            setTimeout(sendNext, 500); // Continue with the next user
          });
      }, "image/png");
    });
  }

  sendNext();
});

// Send Certificate via Email
document.getElementById("emailForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("recipientName").value.trim();
  const email = document.getElementById("recipientEmail").value.trim();

  if (!name || !email) {
    alert("Please provide both name and email.");
    return;
  }

  renderPDFPage(1, () => {
    ctx.fillStyle = "#000";
    ctx.font = "50px Georgia";
    ctx.textAlign = "center";

    const nameY = canvas.height / 2 + 20;
    ctx.fillText(name, canvas.width / 2, nameY);

    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("certificate", blob, `${name}_certificate.png`);

      fetch("/send-email", {
        method: "POST",
        body: formData,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to send email.");
          }
          return res.json();
        })
        .then((data) => {
          alert(data.message || "Email sent successfully!");
        })
        .catch((err) => {
          console.error("Error sending email:", err);
          alert("Failed to send email. Please try again later.");
        });
    }, "image/png");
  });
});
