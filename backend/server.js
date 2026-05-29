const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "semena-jwt-secret-2026";

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "shop",
  connectionLimit: 10,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed — server will start without DB");
    console.error("Error:", err.message);
  } else {
    console.log("MySQL connected");
  }
});

const SVG = {
  ring: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCBmaWxsPSIjZmRmNWU2IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSI4Ii8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTgwIiByPSIyMCIgZmlsbD0iIzg3Q0VFQiIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTTE3MCAyMzAgUTIwMCAzMTAgMjAwIDM0MCBRMjAwIDMxMCAyMzAgMjMwIiBmaWxsPSIjZDRhZjM3Ii8+PC9zdmc+",
  earrings: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCBmaWxsPSIjZjBmOGZmIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSI2Ii8+PGNpcmNsZSBjeD0iMjUwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utd2lkdGg9IjYiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjEyIiBmaWxsPSIjZmY2YjZiIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNTAiIHI9IjEyIiBmaWxsPSIjZmY2YjZiIiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNMTUwIDE5MCBMMTUwIDI4MCBNMjUwIDE5MCBMMjUwIDI4MCIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utd2lkdGg9IjQiLz48L3N2Zz4=",
  necklace: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCBmaWxsPSIjZmZmNWY1IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIvPjxwYXRoIGQ9Ik0xMDAgMTIwIFEyMDAgNjAgMzAwIDEyMCBRMjgwIDIwMCAyMDAgMzQwIFE5MCAyMDAgMTAwIDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utd2lkdGg9IjUiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjI1IiBmaWxsPSIjNTBDODc4IiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNDAiIHI9IjgiIGZpbGw9IiNkNGFmMzciLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNDAiIHI9IjgiIGZpbGw9IiNkNGFmMzciLz48L3N2Zz4=",
  bracelet: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCBmaWxsPSIjZjVmMGZmIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIvPjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIyMDAiIHJ4PSIxNDAiIHJ5PSI3MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utd2lkdGg9IjgiLz48Y2lyY2xlIGN4PSIxNDAiIGN5PSIxNzAiIHI9IjEyIiBmaWxsPSIjODdDRUVCIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNDUiIHI9IjEyIiBmaWxsPSIjZmY2YjZiIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIyNjAiIGN5PSIxNzAiIHI9IjEyIiBmaWxsPSIjNTBDODc4IiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIyNzAiIGN5PSIyMzAiIHI9IjEyIiBmaWxsPSIjRkZENzAwIiBvcGFjaXR5PSIwLjgiLz48L3N2Zz4=",
  gem: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCBmaWxsPSIjZjBmZmYwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIvPjxwb2x5Z29uIHBvaW50cz0iMjAwLDYwIDMwMCwxNzAgMjAwLDM0MCAxMDAsMTcwIiBmaWxsPSIjNTBDODc4IiBvcGFjaXR5PSIwLjciIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHBvbHlnb24gcG9pbnRzPSIyMDAsMTAwIDI2MCwxODAgMjAwLDMxMCAxNDAsMTgwIiBmaWxsPSIjOThGQjk4IiBvcGFjaXR5PSIwLjYiLz48cG9seWdvbiBwb2ludHM9IjIwMCw2MCAzMDAsMTcwIDIwMCwxODAgMTAwLDE3MCIgZmlsbD0iI2Q0YWYzNyIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+",
};

const products = [
  { id: 1, name: "Кольцо с бриллиантами", category: "Кольца", description: "Кольцо из красного золота с бирманским рубином и бриллиантами", price: 120000, image: SVG.ring, badge: "Новинка" },
  { id: 2, name: "Сапфировые серьги", category: "Серьги", description: "Серьги из белого золота с натуральными сапфирами и бриллиантовым обрамлением", price: 89500, image: SVG.earrings, badge: "Новинка" },
  { id: 3, name: "Изумрудное колье", category: "Ожерелья", description: "Роскошное колье с колумбийским изумрудом в окружении бриллиантов", price: 210000, image: SVG.necklace, badge: "Эксклюзив" },
  { id: 4, name: "Теннисный браслет", category: "Браслеты", description: "Классический браслет с бриллиантами общей массой 2.5 карата", price: 185000, image: SVG.bracelet, badge: "Новинка" },
  { id: 5, name: "Рубиновое кольцо", category: "Кольца", description: "Кольцо из красного золота с бирманским рубином и бриллиантами", price: 142000, image: SVG.ring, badge: "Хит продаж" },
  { id: 6, name: "Жемчужные серьги", category: "Серьги", description: "Серьги с южно-морским жемчугом и бриллиантовыми подвесками", price: 68500, image: SVG.earrings },
  { id: 7, name: "Бриллиант 1 карат", category: "Камни", description: "Бриллиант высшей чистоты VS1, цвет D, круглая огранка", price: 98000, image: SVG.gem },
  { id: 8, name: "Золотой браслет", category: "Браслеты", description: "Массивный браслет из желтого золота 585 пробы с гравировкой", price: 76000, image: SVG.bracelet },
];

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API работает" });
});

app.get("/products", (req, res) => {
  res.json(products);
});

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Заполните все поля" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    db.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ message: "Ошибка сервера" });
        }

        if (results.length > 0) {
          return res.status(409).json({ message: "Пользователь с таким email уже существует" });
        }

        try {
          const hashedPassword = await bcrypt.hash(password, 10);

          db.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name.trim(), normalizedEmail, hashedPassword],
            (err, result) => {
              if (err) {
                return res.status(500).json({ message: "Ошибка сервера" });
              }

              const token = jwt.sign(
                { id: result.insertId, email: normalizedEmail },
                JWT_SECRET,
                { expiresIn: "24h" }
              );

              res.status(201).json({
                message: "Регистрация успешна",
                token,
                user: { id: result.insertId, name: name.trim(), email: normalizedEmail },
              });
            }
          );
        } catch (hashErr) {
          res.status(500).json({ message: "Ошибка сервера" });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Введите email и пароль" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    db.query(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [normalizedEmail],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ message: "Ошибка сервера" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Неверный логин или пароль" });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(401).json({ message: "Неверный логин или пароль" });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          message: "Вход выполнен",
          token,
          user: { id: user.id, name: user.name, email: user.email },
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Недействительный токен" });
  }
}

app.get("/auth/me", authMiddleware, (req, res) => {
  db.query(
    "SELECT id, name, email FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: "Пользователь не найден" });
      }
      res.json({ user: results[0] });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server запущен: http://localhost:${PORT}`);
});
