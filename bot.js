// IMPORTS =============================>
import "dotenv/config";
import { Markup, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import generatePDF, { getPDF } from "./pdf_generator.js";
import readTable from "./table_reader.js";
import path from "path";
import { fileURLToPath } from "url";
// DB
import { addUser, findUserById, addUserPhone, checkAuth } from "./db.js";

// Settings =========>
const pe = process.env;
const token = pe.APP_TYPE === "dev" ? pe.DEV : pe.PROD;
const bot = new Telegraf(token);
const helpCaption = `
- Отправь мне таблицу эксель (.xlsx) и я напечатаю этикетки. Убедись, что он заполнен как в примере выше

[📝 Шаблоны]
/template - шаблон для этикеток коробов

[⚠️ В разработке]
/subscribe - подписаться на поставки`;

// Terminal styles
const FgYellow = "\x1b[33m%s\x1b[0m";

// Stickers [sticker id = ctx.message.sticker.file_id]
const sticGuineaPig =
  "CAACAgIAAxkBAAN6ZxMV75k-n9lFqkJZzfLo0_4tV4YAApYWAALCy_BIaXZUZ53X0Ys2BA";
const sticHamsterBanana =
  "CAACAgIAAxkBAAOlZyQ5suljzEX517ED44lOxjNDK9cAAhJkAAKwcSBJYtzrlvYnfHA2BA";
const sticStop =
  "CAACAgIAAxkBAAID12dGD1HcLrSIkMy7ILmBT_brOEusAAJoEQAC9r6hS93yOBQEg8-JNgQ";
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
      await ctx.replyWithSticker(sticHamsterBanana);
      return ctx.reply("⚠️ В файле больше 1000 строк");
    }

    await ctx.replyWithSticker(sticGuineaPig);
    ctx.reply(`Кол-во строк: ${table.length}\n\nОжидайте...`);

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
      { caption: "✅ Этикетки готовы!" }
    );

    return;
  } catch (error) {
    ctx.reply(
      "⛔️ Не удалось обработать файл. Убедись, что он заполнен по инструкции /help"
    );
    console.error(error);
  }
}

// START
bot.start((ctx) => {
  const { id, first_name, username } = ctx.from;

  ctx.reply(
    `Привет, ${first_name}

Выбери команду /help чтобы открыть инструкции
Отправь мне заполненный файл поставки, а дальше я все улажу сам 😁
`
  );
});

// COMMANDS
// Get sticker ID
// bot.on(message('sticker'), (ctx) => ctx.reply(ctx.message.sticker.file_id))

// Get contact
bot.on(message("contact"), (ctx) => {
  const addUserPhoneResult = addUserPhone(
    ctx.from.id,
    ctx.message.contact.phone_number
  );
  if (addUserPhoneResult) {
    ctx.reply("✅ Номер подтвержден!");
  } else {
    ctx.reply("❌ не удалось подтвердить номер. Связаться с админом @");
  }
});

bot.help((ctx) => {
  const photoPath = pp("src/imgs/example.png");

  ctx.replyWithPhoto({ source: photoPath }, { caption: helpCaption });
});

bot.command("template", (ctx) => {
  const filePath = pp("src/docs/template.xlsx");

  return ctx.replyWithDocument({ source: filePath }).catch((error) => {
    console.error("Ошибка при отправке файла:", error);
    ctx.reply("Не удалось передать шаблон.");
  });
});

bot.on("message", async (ctx) => {
  const { id, first_name, username } = ctx.from;
  console.log(`User: ${id}, ${first_name}, ${username}`);

  
  // Check user
  if (!findUserById(id)) {
    addUser(ctx.from);
  }
  // Check auth =========>
  const checkAuthResult = checkAuth(ctx.from.id);
  console.log(checkAuthResult);

  if (!checkAuthResult) {
    await ctx.replyWithSticker(sticStop);
    ctx.reply(
      "⛔️ Пожалуйста, поподтверди личность отправив свой номер телефона",
      Markup.keyboard([
        Markup.button.contactRequest("Отправить номер телефона"),
      ])
        .resize()
        .oneTime()
    );

    return;
  }

  // После проверки авторизации
  // Print .pdf
  if (
    ctx.message.document &&
    ctx.message.document.file_name.endsWith(".xlsx")
  ) {
    printSHK(ctx);
  }

  return ctx.reply("Выбери действие");
});

// Start bot =============================>
bot.launch();
console.log("\nApp is running...");
if (pe.APP_TYPE === "dev") {
  console.log(FgYellow, "Dev mode!\n");
}
