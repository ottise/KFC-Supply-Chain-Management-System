# Hướng dẫn Triển khai Docker Hub & VPS

Tài liệu này hướng dẫn cách đóng gói (build), đẩy lên Docker Hub và triển khai dự án lên máy chủ VPS.

---

## 🚀 1. Build và Push lên Docker Hub

Thực hiện trên **máy tính cá nhân (local)**:

```powershell
# 1. Đăng nhập Docker Hub (chỉ cần làm 1 lần)
docker login

# 2. Build image cho SQL (để cập nhật scripts mới)
docker compose build sql

# 3. Đẩy image lên Docker Hub
docker push shiroruct/kfc-sql:latest

# 4. (Tùy chọn) Build và Push các service khác nếu có thay đổi code:
# docker compose build authentication
# docker push shiroruct/kfc-auth:latest
```

---

## 🌐 2. Cài đặt Docker trên VPS

Thực hiện trên **VPS (Ubuntu/Debian)**:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Cài đặt Docker Compose Plugin
sudo apt install docker-compose-plugin -y

# 4. Kiểm tra phiên bản
docker --version
docker compose version
```

---

## 🛠️ 3. Triển khai lên VPS

1. **Copy file `docker-compose.yml`** từ máy local lên VPS.
2. **Thực hiện trên VPS**:

```bash
# 1. Kéo image mới nhất từ Docker Hub về
docker compose pull

# 2. Xóa dữ liệu cũ (Xóa volume) và khởi động lại
# LƯU Ý: Flag -v rất quan trọng để xóa schema cũ và nạp lại Sample Data mới
docker compose down -v
docker compose up -d
```

## 🔍 Kiểm tra kết quả
- Xem log SQL để biết scripts đã chạy chưa: `docker compose logs sql`
- Kiểm tra dữ liệu: Đăng nhập bằng tài khoản `Admin` đã được seed trong file `02_identity_sample.sql`.
