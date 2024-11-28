import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Получаем путь к текущему файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к файлу с данными
const filePath = path.join(__dirname, "./db/users.json");

// Функция для загрузки пользователей из файла
const loadUsers = () => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }
  return [];
};

// Функция для сохранения пользователей в файл
const saveUsers = (users) => {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
};

// Функция для добавления нового пользователя
export const addUser = (user) => {
  const users = loadUsers();
  const newUser = {
    id: user.id,
    name: user.first_name,
    username: user.username,
    phone: 0,
  };
  users.push(newUser);
  saveUsers(users);
  console.log(`User added: ${JSON.stringify(newUser)}`);
};

// Функция для поиска пользователя по ID
export const findUserById = (id) => {
  const users = loadUsers();
  const user = users.find((user) => user.id === id);
  return user ? user : false;
};

// AUTH
export const checkAuth = (id) => {
  const users = loadUsers();
  const user = users.find((user) => user.id === id && user.phone);
  return user ? true : false;
};

// test
export function editUser(userId, userValue) {
  const users = loadUsers();
  const user = users.find((user) => user.id === userId);
  users.push((user.phone = userValue));
  saveUsers(users);
}

// == Add user Phone
export const addUserPhone = (userId, userPhone) => {
  try {
    const users = loadUsers();

    // Ищем пользователя в массиве
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      // Если пользователь найден, проверяем, есть ли у него телефон
      if (!users[userIndex].phone) {
        users[userIndex].phone = userPhone; // Добавляем телефон, если его нет
      }
    } else {
      // Если пользователь не найден, добавляем нового
      users.push({ id: userId, phone: userPhone });
    }

    saveUsers(users); // Сохраняем обновлённый массив

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
