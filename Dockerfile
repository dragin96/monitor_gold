# Используем официальный образ Puppeteer с предустановленным Chrome
FROM ghcr.io/puppeteer/puppeteer:24.27.0

# Переключаемся на root для установки дополнительных пакетов
USER root

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (без puppeteer, используем версию из образа)
RUN npm ci --only=production --omit=optional

# Копируем исходный код
COPY . .

# Создаём директории для данных
RUN mkdir -p /app/data /app/storage

# Даём права на запись для пользователя pptruser
RUN chown -R pptruser:pptruser /app

# Переключаемся обратно на непривилегированного пользователя
USER pptruser

# Устанавливаем переменные окружения для Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Запускаем бота
CMD ["npm", "start"]
