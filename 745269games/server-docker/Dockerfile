# FROM node:18-alpine
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:18-alpine

# 安装编译 better-sqlite3 必需的工具（避坑关键）
RUN apk add --no-cache python3 py3-pip make g++

# 设置工作目录
WORKDIR /app

# 复制配置文件并安装依赖
COPY package*.json ./
COPY .npmrc ./
RUN npm install

# 复制代码、数据库脚本和打包好的前端页面
COPY src ./src
COPY schema.sql ./
COPY dist ./dist

# 创建持久化数据文件夹
RUN mkdir ./data

# 暴露 1233 端口
EXPOSE 1233

# 启动服务
CMD ["npm", "start"]