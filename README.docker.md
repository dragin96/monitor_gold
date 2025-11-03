# 🐳 Docker Deployment Guide

Руководство по запуску GoldApple Category Tracker Bot в Docker.

## Быстрый старт

### 1. Создайте .env файл

```bash
cp .env.example .env
nano .env
```

Добавьте ваш токен бота:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
CHECK_INTERVAL=5
```

### 2. Запустите с помощью Docker Compose

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## Ручная сборка Docker

### Сборка образа

```bash
docker build -t goldapple-bot .
```

### Запуск контейнера

```bash
docker run -d \
  --name goldapple-tracker \
  --restart unless-stopped \
  -e TELEGRAM_BOT_TOKEN="your_bot_token_here" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/storage:/app/storage \
  goldapple-bot
```

## Управление контейнером

### Просмотр логов
```bash
docker logs -f goldapple-tracker
```

### Остановка
```bash
docker stop goldapple-tracker
```

### Перезапуск
```bash
docker restart goldapple-tracker
```

### Удаление
```bash
docker rm -f goldapple-tracker
```

## Обновление бота

```bash
# Остановка и удаление старого контейнера
docker-compose down

# Обновление кода (git pull или копирование файлов)
git pull

# Пересборка и запуск
docker-compose up -d --build
```

## Мониторинг

### Проверка статуса
```bash
docker-compose ps
```

### Использование ресурсов
```bash
docker stats goldapple-tracker-bot
```

### Логи с фильтрацией
```bash
docker-compose logs -f --tail=100 | grep "ERROR"
```

## Troubleshooting

### Бот не запускается
```bash
# Проверьте логи
docker-compose logs

# Проверьте .env файл
cat .env

# Проверьте права на директории
ls -la data/ storage/
```

### Chrome/Puppeteer ошибки
Образ `ghcr.io/puppeteer/puppeteer:23.11.1` уже содержит Chrome, но если возникают проблемы:
```bash
# Пересоберите образ
docker-compose build --no-cache
```

### Очистка данных
```bash
# Удалить все данные подписок
rm -rf data/ storage/

# Создать директории заново
mkdir -p data storage
```

## Особенности Docker образа

- **Базовый образ**: `ghcr.io/puppeteer/puppeteer:23.11.1` - официальный образ с предустановленным Chrome
- **Headless режим**: Автоматически работает в headless режиме
- **Персистентность данных**: Подписки сохраняются в volume `./data` и `./storage`
- **Автоперезапуск**: `restart: unless-stopped` обеспечивает автоматический перезапуск при сбоях
- **Ограничение ресурсов**: Лимиты CPU и памяти предотвращают перегрузку сервера

## Production Deployment

### На сервере

```bash
# 1. Склонируйте репозиторий
git clone <your-repo>
cd gold_apple

# 2. Создайте .env
nano .env

# 3. Запустите
docker-compose up -d

# 4. Проверьте статус
docker-compose logs -f
```

### Системный сервис (опционально)

Для автозапуска при перезагрузке сервера можно настроить systemd:

```bash
sudo nano /etc/systemd/system/goldapple-bot.service
```

```ini
[Unit]
Description=GoldApple Tracker Bot
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/gold_apple
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable goldapple-bot
sudo systemctl start goldapple-bot
```
