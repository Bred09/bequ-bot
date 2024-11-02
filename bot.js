// IMPORTS =============================>
import "dotenv/config";
import { Markup, Telegraf } from "telegraf";
import generatePDF, { getPDF } from "./pdf_generator.js";
import readTable from "./table_reader.js";
import path from "path";
import { fileURLToPath } from "url";
import auth from "./auth.js";
// DB
import { addUser, findUserById } from "./db.js";

// Functions
// Функция для получения пути файла PhotoPath
function pp(filename) {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), filename);
}

// Print SHK boxs
function printSHK(ctx) {
  // Generate .PDF proccess
  try {
    const file_id = ctx.message.document.file_id;
    const fileLink = ctx.telegram.getFileLink(file_id);

    // Получение файла в виде буфера
    const response = fetch(fileLink);
    const arrayBuffer = response.arrayBuffer();

    // Преобразование ArrayBuffer в Buffer
    const buffer = Buffer.from(arrayBuffer);

    // Чтение таблицы
    const table = readTable(buffer);

    if (table.length > 1000) {
      ctx.reply("⚠️ В файле больше 1000 строк");
      return ctx.replyWithSticker(sticHamsterBanana);
    }

    let res = `Кол-во строк: ${table.length}\n\nОжидайте...`;
    ctx.reply(res);
    ctx.replyWithSticker(sticGuineaPig);

    // Генерация PDF
    const pdfBuffer = generatePDF(table);

    // Преобразование ArrayBuffer PDF в Buffer
    const pdfFile = Buffer.from(pdfBuffer);

    // Отправка PDF файла пользователю
    ctx.replyWithDocument(
      {
        source: pdfFile,
        filename: "bequ_shk.pdf",
      },
      { caption: "✅ Ваши этикетки готовы!" }
    );
  } catch (error) {
    const startCaption =
      "⛔️ Не удалось обработать файл. Убедитесь, что он заполнен как в примере выше";
    const photoPath = pp("img/example.png");

    ctx.replyWithPhoto({ source: photoPath }, { caption: startCaption });
    console.error(error);
  }
}

// Settings =============================>
let FgYellow = "\x1b[33m%s\x1b[0m";

const pe = process.env;
const token = pe.APP_TYPE === "dev" ? pe.DEV : pe.PROD;
const bot = new Telegraf(token);
// Stickers [sticker id = ctx.message.sticker.file_id]
const sticGuineaPig =
  "CAACAgIAAxkBAAN6ZxMV75k-n9lFqkJZzfLo0_4tV4YAApYWAALCy_BIaXZUZ53X0Ys2BA";
const sticHamsterBanana =
  "CAACAgIAAxkBAAOlZyQ5suljzEX517ED44lOxjNDK9cAAhJkAAKwcSBJYtzrlvYnfHA2BA";

// START
console.log("App is running...");
if (pe.APP_TYPE === "dev") {
  console.log(FgYellow, "Dev mode!");
}

bot.start((ctx) => {
  const { id, first_name, username } = ctx.from;
  // DB
  if (!findUserById(id)) {
    addUser(ctx.from);
  }

  ctx.reply(
    `😃 Привет, ${first_name}

/start - запустить/перезапустить бота
/shk - создать .pdf этикетки до 1 000 шт.
/subscribe - в разработке...
`
  );

  commandQueue = false;
});

// COMMANDS
bot.on("message", async (ctx) => {
  const { id, first_name, username } = ctx.from;

  let usersQueue = []
  function ochered(userData){
    usersQueue.push(userData)
    console.log(usersQueue);
    
  }

  // Print .pdf
  if (
    ctx.message.document &&
    ctx.message.document.file_name.endsWith(".xlsx")
  ) {
    ochered(id)

    // return ctx.reply(printSHK(ctx));
  }

  // Other
  return ctx.reply("Что вы хотите сделать?");
});

// Start bot =============================>
bot.launch();
