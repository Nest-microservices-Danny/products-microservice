FROM node:22-alpine3.19

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .
ENV DATABASE_URL="file:./dev.db"

RUN npx prisma generate

RUN npx prisma migrate deploy

EXPOSE 3001