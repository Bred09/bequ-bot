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

// Settings =============================>
let FgYellow = "\x1b[33m%s\x1b[0m";

const pe = process.env;
const token = pe.APP_TYPE === "dev" ? pe.DEV : pe.PROD;
const bot = new Telegraf(token);
let commandQueue = false;
const startCaption = `Беку-бот к вашим услугам😊:

/shk - создать .pdf этикетки из ШК коробок
/subscribe - в разработке...
`;

// START
console.log("App is running...");
if (pe.APP_TYPE === "dev") {
  console.log(FgYellow, "Dev mode!");
}

// Дальнейший код бота, где используется token

bot.start((ctx) => {
  const { id, first_name, username } = ctx.from;
  // DB
  if (!findUserById(id)) {
    addUser(ctx.from);
  }

  const messageText = ctx.message.text;

  ctx.reply(
    `😃 Привет, ${first_name}

${messageText}`
  );

  ctx.reply(startCaption);

  commandQueue = false;
});

// COMMANDS
bot.command("shk", (ctx) => {
  const startCaption = "Отправьте мне .xlsx файл в таком формате";
  const photoPath = pp("img/example.png");

  ctx.replyWithPhoto({ source: photoPath }, { caption: startCaption });

  commandQueue = ctx.command;
});

bot.on("message", async (ctx) => {
  if (commandQueue === "shk") {
    if (
      ctx.message.document &&
      ctx.message.document.file_name.endsWith(".xlsx")
    ) {
      // Generate .PDF proccess
      try {
        const file_id = ctx.message.document.file_id;
        const fileLink = await ctx.telegram.getFileLink(file_id);

        // Получение файла в виде буфера
        const response = await fetch(fileLink);
        const arrayBuffer = await response.arrayBuffer();

        // Преобразование ArrayBuffer в Buffer
        const buffer = Buffer.from(arrayBuffer);

        // Чтение таблицы
        const table = readTable(buffer);

        let res = `Кол-во строк: ${table.length}\n\nОжидайте...`;
        ctx.reply(res);
        const sticWaitHamster =
          "CAACAgIAAxkBAAN6ZxMV75k-n9lFqkJZzfLo0_4tV4YAApYWAALCy_BIaXZUZ53X0Ys2BA";

        ctx.replyWithSticker(sticWaitHamster);

        // Генерация PDF
        const pdfBuffer = await generatePDF(table);

        // Преобразование ArrayBuffer PDF в Buffer
        const pdfFile = Buffer.from(pdfBuffer);

        // Отправка PDF файла пользователю
        await ctx.replyWithDocument(
          {
            source: pdfFile,
            filename: "bequ_shk.pdf",
          },
          { caption: "✅ Ваши этикетки готовы!" }
        );

        // очищаем очередь
        commandQueue = false;
      } catch (error) {
        const startCaption =
          "⛔️ Не удалось обработать файл. Убедитесь, что он заполнен как в примере выше";
        const photoPath = pp("img/example.png");

        ctx.replyWithPhoto({ source: photoPath }, { caption: startCaption });
        console.error(error);
      }
    } else {
      ctx.reply(`☺️ я жду таблицу .xlsx

/start 👈 отменить действие`);
    }
  } else {
    ctx.reply(`🥹 я не понимаю что вы хотите...
  
Выберите что вам нужно:

/shk - создать .pdf этикетки из ШК коробок
/subscribe - в разработке...`);
  }
});

// Start bot =============================>
bot.launch();
