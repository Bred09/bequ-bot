// IMPORTS =============================>
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export function getPDF(data) {
  return data;
}

export default async function generatePDF(data) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [58, 40],
  });

  for (const el of data) {
    // font
    doc.addFont("./fonts/Roboto-Regular.ttf", "RobotoRegular", "normal");
    doc.setFont("RobotoRegular");

    let margin = 4;

    // Top-left text (Размер)
    doc.text(`${el["Размер"]}`, 4, 10);

    // Top-right text (ID)
    doc.text(`${el["№"]}`, 40 - margin, 10, null, null, "right");

    // Generate QR code from SHK
    const qrdata = el["ШК"];
    const url = await QRCode.toDataURL(qrdata, { margin: 0 });
    const qrsize = 32;
    doc.addImage(url, "PNG", 4, 12, qrsize, qrsize);

    // Bottom-left text (Артикул)
    const maxWidth = 40 - margin - 2;
    const txtArticel = `${el["Артикул"]}`.substring(0, 30);
    doc.text(doc.splitTextToSize(txtArticel, maxWidth), 4, 54 - margin);

    // Если это не последний элемент, добавить новую страницу
    if (data.indexOf(el) !== data.length - 1) {
      doc.addPage();
    }
  }

  // Возвращаем PDF как array buffer для отправки в Telegram
  return doc.output("arraybuffer"); // arraybuffer, чтобы использовать в Telegram
}
