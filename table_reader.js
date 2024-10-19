// IMPORTS =============================>
import xlsx from "xlsx";

export default function readTable(buffer) {
  // Чтение данных из буфера файла
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet_name = workbook.SheetNames[0]; // Выбираем первый лист
  const worksheet = workbook.Sheets[sheet_name];
  const data = xlsx.utils.sheet_to_json(worksheet);
  return data;
}
