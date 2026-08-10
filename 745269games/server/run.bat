@echo off
chcp 65001 >nul
echo 🛑 正在清理旧容器 (如果存在)...
docker rm -f games-backend-local >nul 2>&1

echo 📦 正在重新构建镜像 (这次没加后台运行)...
docker build -t my-games-api .

echo.
echo 🚀 容器启动中... 请紧盯下方的日志输出！
echo =======================================================
docker run --rm -p 5269:3000 -v "%cd%/data:/app/data" --name games-backend-local my-games-api
echo =======================================================
echo.
pause