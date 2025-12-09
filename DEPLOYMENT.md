# 🚀 Guía de Deployment a Producción - Time Flow

## ✅ Checklist Pre-Deployment

### Seguridad

- [ ] Cambiar JWT_SECRET a un valor fuerte (mínimo 32 caracteres)
- [ ] Cambiar contraseña del SuperAdmin
- [ ] Configurar DB_SSLMODE=require
- [ ] Habilitar HTTPS en frontend y backend
- [ ] Configurar CORS correctamente (solo dominios permitidos)
- [ ] Deshabilitar Swagger en producción (opcional)
- [ ] Configurar rate limiting
- [ ] Habilitar logs de seguridad

### Base de Datos

- [ ] Backup de base de datos actual
- [ ] Ejecutar migraciones en producción
- [ ] Verificar índices creados
- [ ] Configurar backup automático
- [ ] Optimizar configuración PostgreSQL

### Aplicación

- [ ] Build optimizado de frontend
- [ ] Variables de entorno configuradas
- [ ] Health checks funcionando
- [ ] Logging configurado
- [ ] Monitoreo configurado

## 🔧 Configuración de Producción

### Backend - Variables de Entorno

```env
# Database (PostgreSQL en la nube)
DB_HOST=tu-servidor-db.postgres.database.azure.com
DB_PORT=5432
DB_USER=timeflow_admin
DB_PASSWORD=************
DB_NAME=timeflow_prod
DB_SSLMODE=require

# Server
PORT=8080
GIN_MODE=release

# JWT (CAMBIAR ESTE VALOR)
JWT_SECRET=un_secreto_muy_largo_y_aleatorio_de_al_menos_32_caracteres_aqui

# Microsoft OAuth
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_TENANT_ID=tu_tenant_id
MICROSOFT_REDIRECT_URI=https://timeflow.tuempresa.com/auth/callback

# CORS (solo tus dominios)
ALLOWED_ORIGINS=https://timeflow.tuempresa.com,https://www.timeflow.tuempresa.com

# Logs
LOG_LEVEL=info
LOG_FILE=/var/log/timeflow/app.log
```

### Frontend - Variables de Entorno

```env
VITE_API_BASE_URL=https://api.timeflow.tuempresa.com/api/v1
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_TENANT_ID=tu_tenant_id
VITE_MICROSOFT_REDIRECT_URI=https://timeflow.tuempresa.com/auth/callback
```

## 🏗️ Opciones de Deployment

### Opción 1: Azure App Service (Recomendado)

#### Backend (Azure App Service)

```bash
# 1. Crear App Service
az webapp create \
  --resource-group timeflow-rg \
  --plan timeflow-plan \
  --name timeflow-api \
  --runtime "GO:1.21"

# 2. Configurar variables de entorno
az webapp config appsettings set \
  --resource-group timeflow-rg \
  --name timeflow-api \
  --settings @backend-settings.json

# 3. Deploy desde GitHub
az webapp deployment source config \
  --resource-group timeflow-rg \
  --name timeflow-api \
  --repo-url https://github.com/Jaliko05/time-flow \
  --branch main \
  --manual-integration
```

#### Frontend (Azure Static Web Apps)

```bash
# 1. Crear Static Web App
az staticwebapp create \
  --name timeflow-frontend \
  --resource-group timeflow-rg \
  --source https://github.com/Jaliko05/time-flow \
  --location "East US" \
  --branch main \
  --app-location "frontend" \
  --output-location "dist"

# 2. Configurar variables de entorno en Azure Portal
```

#### Base de Datos (Azure Database for PostgreSQL)

```bash
# Crear servidor PostgreSQL
az postgres flexible-server create \
  --resource-group timeflow-rg \
  --name timeflow-db-server \
  --location eastus \
  --admin-user timeflow_admin \
  --admin-password '************' \
  --sku-name Standard_B1ms \
  --version 14 \
  --storage-size 32

# Crear base de datos
az postgres flexible-server db create \
  --resource-group timeflow-rg \
  --server-name timeflow-db-server \
  --database-name timeflow_prod

# Configurar firewall (permitir Azure Services)
az postgres flexible-server firewall-rule create \
  --resource-group timeflow-rg \
  --name timeflow-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Opción 2: Docker + Azure Container Instances

#### Dockerfile - Backend

```dockerfile
# backend/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /app/.env.example .env

EXPOSE 8080

CMD ["./main"]
```

#### Dockerfile - Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf para Frontend

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

#### Docker Compose para Producción

```yaml
version: "3.8"

services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: timeflow_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: timeflow_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - timeflow-network
    restart: always

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: timeflow_admin
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: timeflow_prod
      DB_SSLMODE: disable
      JWT_SECRET: ${JWT_SECRET}
      MICROSOFT_CLIENT_ID: ${MICROSOFT_CLIENT_ID}
      MICROSOFT_CLIENT_SECRET: ${MICROSOFT_CLIENT_SECRET}
      GIN_MODE: release
    depends_on:
      - db
    networks:
      - timeflow-network
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - timeflow-network
    restart: always

networks:
  timeflow-network:
    driver: bridge

volumes:
  postgres_data:
```

### Opción 3: VPS Manual (DigitalOcean, AWS EC2, etc.)

#### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Go
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Instalar Node.js y pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Instalar Nginx
sudo apt install -y nginx
```

#### 2. Configurar Base de Datos

```bash
sudo -u postgres psql

CREATE DATABASE timeflow_prod;
CREATE USER timeflow_admin WITH PASSWORD '************';
GRANT ALL PRIVILEGES ON DATABASE timeflow_prod TO timeflow_admin;
\q
```

#### 3. Clonar y Configurar Proyecto

```bash
cd /var/www
sudo git clone https://github.com/Jaliko05/time-flow.git
cd time-flow

# Backend
cd backend
sudo nano .env  # Configurar variables
go mod download
go build -o timeflow-api

# Frontend
cd ../frontend
pnpm install
pnpm build
```

#### 4. Configurar Systemd Service para Backend

```bash
sudo nano /etc/systemd/system/timeflow-api.service
```

```ini
[Unit]
Description=Time Flow API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/time-flow/backend
ExecStart=/var/www/time-flow/backend/timeflow-api
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start timeflow-api
sudo systemctl enable timeflow-api
```

#### 5. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/timeflow
```

```nginx
server {
    listen 80;
    server_name timeflow.tuempresa.com;

    # Frontend
    root /var/www/time-flow/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/timeflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Configurar SSL con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d timeflow.tuempresa.com
sudo systemctl reload nginx
```

## 📊 Monitoreo y Logs

### Configurar Logs en Backend

Modificar `backend/main.go`:

```go
import (
    "log"
    "os"
)

func setupLogging() {
    logFile := os.Getenv("LOG_FILE")
    if logFile != "" {
        f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
        if err != nil {
            log.Fatal(err)
        }
        log.SetOutput(f)
    }
}

func main() {
    setupLogging()
    // ... resto del código
}
```

### Ver Logs

```bash
# Backend (systemd)
sudo journalctl -u timeflow-api -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Health Checks

Agregar endpoint de health en backend:

```go
// En routes/routes.go
router.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{
        "status": "ok",
        "database": checkDatabase(),
        "timestamp": time.Now(),
    })
})
```

### Monitoreo con Uptime Robot

1. Crear cuenta en [UptimeRobot.com](https://uptimerobot.com)
2. Agregar monitor:
   - URL: `https://timeflow.tuempresa.com/health`
   - Tipo: HTTP(s)
   - Intervalo: 5 minutos
3. Configurar alertas por email

## 🔒 Seguridad Adicional

### 1. Firewall

```bash
# UFW en Ubuntu
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 3. Rate Limiting en Nginx

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        location /api {
            limit_req zone=api burst=20 nodelay;
            # ... resto de configuración
        }
    }
}
```

## 📦 Backups

### Script de Backup Automático

```bash
sudo nano /usr/local/bin/backup-timeflow.sh
```

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/timeflow"
DB_NAME="timeflow_prod"

mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -U timeflow_admin $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos (si hay uploads)
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/time-flow/uploads

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/backup-timeflow.sh

# Agregar a cron (ejecutar diariamente a las 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-timeflow.sh >> /var/log/backup-timeflow.log 2>&1
```

## 🚀 Proceso de Deployment

### Deployment Inicial

```bash
# 1. Preparar entorno
# 2. Configurar base de datos
# 3. Deploy backend
# 4. Deploy frontend
# 5. Verificar health checks
# 6. Configurar SSL
# 7. Configurar backups
# 8. Configurar monitoreo
```

### Actualizaciones Posteriores

```bash
# 1. Hacer backup
/usr/local/bin/backup-timeflow.sh

# 2. Pull cambios
cd /var/www/time-flow
sudo git pull origin main

# 3. Actualizar backend
cd backend
go build -o timeflow-api
sudo systemctl restart timeflow-api

# 4. Actualizar frontend
cd ../frontend
pnpm install
pnpm build

# 5. Verificar
curl https://timeflow.tuempresa.com/health
```

## ✅ Verificación Post-Deployment

```bash
# 1. Health check
curl https://timeflow.tuempresa.com/health

# 2. Backend API
curl https://timeflow.tuempresa.com/api/v1/areas

# 3. Frontend
curl -I https://timeflow.tuempresa.com

# 4. SSL
openssl s_client -connect timeflow.tuempresa.com:443 -servername timeflow.tuempresa.com

# 5. Logs
sudo journalctl -u timeflow-api -n 50
```

## 📞 Troubleshooting Producción

### Backend no inicia

```bash
# Ver logs
sudo journalctl -u timeflow-api -f

# Verificar proceso
ps aux | grep timeflow-api

# Verificar puerto
sudo netstat -tulpn | grep 8080
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión
psql -h localhost -U timeflow_admin -d timeflow_prod

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Frontend no carga

```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

---

**Última actualización**: Diciembre 2024
