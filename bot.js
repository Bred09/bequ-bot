// IMPORTS =============================>
import "dotenv/config";
import { Markup, Telegraf } from "telegraf";
import generatePDF, { getPDF } from "./pdf_generator.js";
import readTable from "./table_reader.js";
import path from "path";
import { fileURLToPath } from "url";
import auth from "./auth.js";
// DB
import { addUser, findUserById, editUser } from "./db.js";

// Settings =========>
const pe = process.env;
const token = pe.APP_TYPE === "dev" ? pe.DEV : pe.PROD;
const bot = new Telegraf(token);

// Terminal styles
const FgYellow = "\x1b[33m%s\x1b[0m";

// Stickers [sticker id = ctx.message.sticker.file_id]
const sticGuineaPig =
  "CAACAgIAAxkBAAN6ZxMV75k-n9lFqkJZzfLo0_4tV4YAApYWAALCy_BIaXZUZ53X0Ys2BA";
const sticHamsterBanana =
  "CAACAgIAAxkBAAOlZyQ5suljzEX517ED44lOxjNDK9cAAhJkAAKwcSBJYtzrlvYnfHA2BA";
// Settings =========<

// Functions
// Функция для получения пути файла PhotoPath
function pp(filename) {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), filename);
}

// Print SHK boxs
async function printSHK(ctx) {
  try {
    const file_id = await ctx.message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(file_id);

    // Получение файла в виде буфера
    const response = await fetch(fileLink);
    const arrayBuffer = await response.arrayBuffer();

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
    const pdfBuffer = await generatePDF(table);

    // Преобразование ArrayBuffer PDF в Buffer
    const pdfFile = Buffer.from(pdfBuffer);

    // Отправка PDF файла пользователю
    ctx.replyWithDocument(
      {
        source: pdfFile,
        filename: "bequ_wb_bot.pdf",
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

// START
// bot.start((ctx) => {
//   const { id, first_name, username } = ctx.from;
//   // DB
//   if (!findUserById(id)) {
//     addUser(ctx.from);
//   }

//   ctx.reply(
//     `😃 Привет, ${first_name}

// Выбери команду /info чтобы открыть инструкции
// Отправь мне excel.xlsx файл и я напечатаю этикетки для WB
// `
//   );
// });

// bot.start((ctx) => {
//   ctx.reply(
//     'Пожалуйста, поделитесь своим номером телефона',
//     Markup.keyboard([
//       Markup.button.contactRequest('Отправить номер телефона')
//     ])
//     .resize()
//     .oneTime()
//   );
// });


// COMMANDS
bot.on("message", (ctx) => {
  const { id, first_name, username } = ctx.from;

  ctx.reply(
    'Пожалуйста, поделитесь своим номером телефона',
    Markup.keyboard([
      Markup.button.contactRequest('Отправить номер телефона')
    ])
      .resize()
      .oneTime()
  );


  // Print .pdf
  if (
    ctx.message.document &&
    ctx.message.document.file_name.endsWith(".xlsx")
  ) {
    printSHK(ctx);
  }
  // Get contact
  if (ctx.message.contact && ctx.message.contact.phone_number) {
    ctx.reply("PHONE")
    editUser(id, ctx.message.contact.phone_number)
  }
});

// Start bot =============================>
bot.launch();
console.log("\nApp is running...");
if (pe.APP_TYPE === "dev") {
  console.log(FgYellow, "Dev mode!\n");
}
