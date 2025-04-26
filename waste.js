// Button: download all as one PDF
document.getElementById("downloadAllBtn2")?.addEventListener("click", () => {
  const pdf = new jsPDF();
  let i = 0;

  function generateNext() {
    if (i >= users.length) {
      pdf.save("all_certificates.pdf");
      return;
    }

    generateCertificate(users[i], () => {
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, 10, canvas.width / 3, canvas.height / 3);
      i++;
      if (i < users.length) pdf.addPage();
      setTimeout(generateNext, 8);
    });
  }

  generateNext();
});
