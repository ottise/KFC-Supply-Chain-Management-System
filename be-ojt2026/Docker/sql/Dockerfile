FROM mcr.microsoft.com/mssql/server:2022-latest

# Thiết lập biến môi trường bắt buộc cho SQL Server
ENV ACCEPT_EULA=Y
ENV MSSQL_SA_PASSWORD=Sql@12345678

# Chép scripts và entrypoint vào container
COPY Databases/Schema /usr/src/app/Schema
COPY Databases/Seed /usr/src/app/Seed
COPY Docker/sql/entrypoint.sh /usr/src/app/entrypoint.sh

# Không thể dùng chmod trực tiếp nếu user ko phải root, nhưng mssql base có thể chạy bash file
USER root
RUN sed -i 's/\r$//' /usr/src/app/entrypoint.sh && chmod +x /usr/src/app/entrypoint.sh
USER mssql

# Expose cổng mặc định
EXPOSE 1433

ENTRYPOINT ["/bin/bash", "/usr/src/app/entrypoint.sh"]
