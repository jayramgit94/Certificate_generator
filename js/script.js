let users = [];
let currentIndex = 0;

const canvas = document.getElementById("certificateCanvas");
const ctx = canvas.getContext("2d");

const certificateImage = new Image();
certificateImage.src = "./assets/certificate.jpg";

// Start once image is loaded
certificateImage.onload = () => {
  fetchUserData();
};

function fetchUserData() {
  fetch("/data/users.json")
    .then((response) => response.json())
    .then((data) => {
      users = data;
      drawCertificate(users[currentIndex]);
    })
    .catch((error) => console.error("Error loading user data:", error));
}

function drawCertificate(user) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(certificateImage, 0, 0, canvas.width, canvas.height);

  // Custom font style and size
  ctx.fillStyle = "#000";
  ctx.font = "50px 'Georgia'"; // You can change this
  ctx.textAlign = "center";

  const nameY = 320;

  ctx.fillText(user.name, canvas.width / 2, nameY);
}

function generateCertificate(user) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(certificateImage, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000";
  ctx.font = "50px 'Georgia'";
  ctx.textAlign = "center";

  const nameY = 320;

  ctx.fillText(user.name, canvas.width / 2, nameY);

  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${user.name}_certificate.jpg`;
    link.click();
  }, "image/png");
}

// Previous button
document.getElementById("prevBtn").addEventListener("click", () => {
  if (users.length === 0) return;
  currentIndex = (currentIndex - 1 + users.length) % users.length;
  drawCertificate(users[currentIndex]);
});

// Next button
document.getElementById("nextBtn").addEventListener("click", () => {
  if (users.length === 0) return;
  currentIndex = (currentIndex + 1) % users.length;
  drawCertificate(users[currentIndex]);
});

// Download current certificate
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (users.length === 0) return;
  generateCertificate(users[currentIndex]);
});

// 📥 Download all certificates
document.getElementById("downloadAllBtn").addEventListener("click", () => {
  let i = 0;

  function generateNext() {
    if (i >= users.length) return;
    generateCertificate(users[i]);
    i++;
    setTimeout(generateNext, 800); // Delay to allow blob/download
  }

  generateNext();
});
