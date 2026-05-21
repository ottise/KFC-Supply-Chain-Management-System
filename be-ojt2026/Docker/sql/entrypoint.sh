#!/bin/bash
# Khởi động SQL Server ở chế độ nền
/opt/mssql/bin/sqlservr &

# Chờ SQL Server khởi động xong
echo "Đang chờ SQL Server khởi động..."
for i in {1..50};
do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sql@12345678 -C -Q "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "SQL Server đã sẵn sàng."
        break
    else
        echo "Chưa sẵn sàng, đợi 1 giây..."
        sleep 1
    fi
done

# Chạy các script tạo cấu trúc DB (Folder Schema)
echo "Đang chạy script khởi tạo cấu trúc CSDL..."
for f in /usr/src/app/Schema/*.sql
do
    echo "Thực thi file $f..."
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sql@12345678 -C -i "$f"
done

# Kiểm tra xem đã từng chạy sample data chưa thông qua 1 file flag lưu trong volume Persistent
if [ ! -f /var/opt/mssql/samples_loaded.flag ]; then
    # Chỉ chạy các file có định dạng chuẩn (bỏ qua các file reset hoặc utils)
    for f in /usr/src/app/Seed/*.sql
    do
        echo "Thực thi file seed $f..."
        /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sql@12345678 -C -i "$f"
    done
    
    # Đánh dấu là đã chạy samples để lần khởi động sau không chạy lại
    touch /var/opt/mssql/samples_loaded.flag
    echo "Đã đánh dấu hoàn tất nạp Sample Data."
else
    echo "Sample Data đã tồn tại từ trước (bỏ qua bước nạp Sample)."
fi

# Chờ tiến trình SQL Server chính (để container không bị tắt)
wait
