const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { imageSize } = require("image-size"); // ✅ correct import

exports.downloadCertificate = async (req, res) => {
  const { studentName, courseName, instructor, certifiedOn, certifiedId } = req.body;

  if (!studentName || !courseName || !instructor) {
    return res.status(400).json({ message: "studentName and courseName are required" });
  }

  const templatePath = path.join(__dirname, "certificate-template.png");

  // ✅ Read file as buffer
  const buffer = fs.readFileSync(templatePath);
  const dimensions = imageSize(buffer);

  // Create PDF with image size
  const doc = new PDFDocument({
    size: [dimensions.width, dimensions.height]
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=certificate.pdf");

  doc.pipe(res);

  // Place image
  doc.image(templatePath, 0, 0, {
    width: dimensions.width,
    height: dimensions.height
  });

  // Dynamic text
  doc.fontSize(100).fillColor("#000").font("Helvetica-Bold")
    .text(studentName, 0, dimensions.height * 0.420, { width: 3380, align: "center" });

  doc.fontSize(50)
    .fillColor("#333")
    .font("Helvetica")
    .text(
      `for successfully completing the ${courseName}`,
      dimensions.width * 0.45,  // left marginx
      dimensions.height * 0.52, // vertical position
      {
        width: dimensions.width * 0.50, // text area width (wraps inside this box)
        align: "center",
      }
    );

  doc.fontSize(60).fillColor("#000").font("Helvetica-Bold")
    .text(instructor, 0, dimensions.height * 0.75, { width: 3335, align: "center" });

  doc.fontSize(35).fillColor("#000").font("Helvetica")
    .text(certifiedOn,0, dimensions.height * 0.915, { width: 2800, align: "center" });

  // const certificateId = Math.random().toString(36).substring(2, 10).toUpperCase();
  doc.fontSize(35).fillColor("#000").font("Helvetica")
    .text(certifiedId, 0, dimensions.height * 0.915, { width: 3800, align: "center" });

  doc.end();
};
