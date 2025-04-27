FROM nginx:alpine

# Копируем нашу HTML страницу
COPY . /usr/share/nginx/html/

# Копируем файл конфигурации Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]