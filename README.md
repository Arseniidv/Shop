# Ювелирный интернет-магазин

Full-stack SPA: Node.js/Express + MySQL + bcrypt + JWT + Nginx.

## Быстрый старт

### 1. Установите Docker

**macOS:** https://docs.docker.com/desktop/setup/install/mac-install/

**Windows/Linux:** Docker Desktop или Docker Engine.

### 2. Запустите Docker

Откройте Docker Desktop или выполните в терминале:

```bash
open -a Docker
```

Дождитесь, пока в строке меню появится зелёный значок Docker.

### 3. Очистите старые контейнеры (если запускали раньше)

```bash
docker rm -f shop_frontend shop_backend shop_db 2>/dev/null; true
```

### 4. Соберите и запустите проект

```bash
docker compose up --build -d
```

### 5. Проверьте статус

```bash
docker ps
```

Все три контейнера должны быть в статусе `Up`.

### 6. Откройте в браузере

- **Магазин:** http://localhost:8080
- **API:** http://localhost:5001/products
- **Профиль / вход:** http://localhost:8080/profile.html

## Остановка

```bash
docker compose down
```

## Пересборка после изменений

```bash
docker compose up --build -d
```

## Структура проекта

```
├── docker-compose.yml      # оркестрация: db + backend + frontend
├── backend/
│   ├── Dockerfile
│   ├── server.js           # API (Express)
│   ├── init.sql            # схема MySQL
│   ├── wait-for-db.sh      # ожидание MySQL перед стартом
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── index.html          # SPA главная
│   ├── profile.html        # регистрация / вход
│   ├── script.js           # клиентская логика
│   └── style.css           # стили
└── .gitignore
```

## API endpoints

| Метод | Путь           | Описание              |
|-------|----------------|-----------------------|
| GET   | /              | Статус API            |
| GET   | /products      | Список товаров        |
| POST  | /auth/register | Регистрация           |
| POST  | /auth/login    | Вход                  |
| GET   | /auth/me       | Текущий пользователь  |

## Технологии

- Backend: Node.js, Express 4, MySQL 2, bcrypt, jsonwebtoken
- Frontend: Vanilla JS SPA, Nginx
- База: MySQL 8
- Инфраструктура: Docker Compose
