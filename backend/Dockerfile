FROM node:18

RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod +x wait-for-db.sh

EXPOSE 5000

CMD ["./wait-for-db.sh", "db", "node", "server.js"]
