# Используем официальный образ Puppeteer с предустановленным Chrome
FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Переключаемся на root для установки дополнительных пакетов
USER root

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаём директории для данных
RUN mkdir -p /app/data /app/storage

# Даём права на запись для пользователя pptruser
RUN chown -R pptruser:pptruser /app

# Переключаемся обратно на непривилегированного пользователя
USER pptruser

# Запускаем бота
CMD ["npm", "start"]
