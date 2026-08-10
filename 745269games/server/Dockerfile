FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# 安装 better-sqlite3 需要编译环境
RUN apk add --no-cache python3 make g++ 
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]