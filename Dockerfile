# Используем официальный образ Puppeteer с предустановленным Chrome
FROM ghcr.io/puppeteer/puppeteer:24.27.0

# Переключаемся на root для установки дополнительных пакетов
USER root

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
# Puppeteer уже установлен в базовом образе, но нужны остальные зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаём директории для данных с правильными правами
RUN mkdir -p /app/data /app/storage && \
    chown -R pptruser:pptruser /app && \
    chmod -R 755 /app/data /app/storage

# Переключаемся обратно на непривилегированного пользователя
USER pptruser

# Запускаем бота
CMD ["npm", "start"]
