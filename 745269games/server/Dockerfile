FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++

RUN npm config set registry https://registry.npmmirror.com

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]