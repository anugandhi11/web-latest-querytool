# 🚀 Deployment Guide - Web Query Tool

**Production-ready deployment guide for Angular 19 + .NET 9 application**

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Manual Deployment](#manual-deployment)
- [Security Checklist](#security-checklist)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### **Required Software**

```bash
# Docker & Docker Compose
Docker Engine >= 24.0
Docker Compose >= 2.20

# For Kubernetes deployment
kubectl >= 1.28
Helm >= 3.12

# For manual deployment
Node.js >= 20.0
.NET SDK >= 9.0
Nginx >= 1.24
```

### **Required Services**

- **Database**: PostgreSQL, MySQL, SQL Server, or Redshift
- **Redis** (optional): For SignalR backplane in multi-instance setup
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

---

## ⚙️ Environment Configuration

### **Step 1: Create Environment File**

```bash
# Copy template
cp .env.example .env

# Edit configuration
nano .env
```

### **Step 2: Configure Database Connections**

```bash
# PostgreSQL
POSTGRES_CONNECTION_STRING=Host=postgres.example.com;Port=5432;Database=mydb;Username=myuser;Password=mypassword

# MySQL
MYSQL_CONNECTION_STRING=Server=mysql.example.com;Port=3306;Database=mydb;Uid=myuser;Pwd=mypassword

# SQL Server
SQLSERVER_CONNECTION_STRING=Server=sqlserver.example.com;Database=mydb;User Id=myuser;Password=mypassword;TrustServerCertificate=True

# AWS Redshift
REDSHIFT_CONNECTION_STRING=Server=my-cluster.region.redshift.amazonaws.com;Port=5439;Database=mydb;User Id=myuser;Password=mypassword
```

### **Step 3: Configure JWT Authentication**

```bash
# Generate secure JWT key (minimum 32 characters)
JWT_SECRET_KEY=$(openssl rand -base64 32)

# Set in .env
JWT_SECRET_KEY=your-generated-key-here
JWT_ISSUER=WebQueryTool
JWT_AUDIENCE=WebQueryToolClient
JWT_EXPIRATION_MINUTES=60
```

### **Step 4: Configure Frontend API URL**

Edit `web-query-tool/src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/v1',
  apiUrlHttps: 'https://api.yourdomain.com/api/v1',
  signalRUrl: 'https://api.yourdomain.com/hubs',
  enableDebugLogs: false,
  queryTimeout: 300,
  maxQueryRows: 10000,
  version: '1.0.0'
};
```

---

## 🐳 Docker Deployment (Recommended)

### **Quick Start**

```bash
# 1. Clone repository
git clone <repository-url>
cd web-latest-querytool

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 3. Build and start services
docker-compose up -d

# 4. Verify deployment
docker-compose ps
docker-compose logs -f
```

### **Access Application**

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000/health
- **Swagger UI**: http://localhost:5000/swagger

### **Docker Commands**

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api
docker-compose logs -f frontend

# Restart service
docker-compose restart api

# Rebuild after code changes
docker-compose up -d --build

# Clean up (WARNING: removes volumes)
docker-compose down -v
```

### **Production Deployment**

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Push to registry
docker tag web-query-tool-api:latest your-registry/web-query-tool-api:v1.0.0
docker push your-registry/web-query-tool-api:v1.0.0

docker tag web-query-tool-frontend:latest your-registry/web-query-tool-frontend:v1.0.0
docker push your-registry/web-query-tool-frontend:v1.0.0

# Deploy on production server
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☸️ Kubernetes Deployment

### **Prerequisites**

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

### **Step 1: Create Namespace**

```bash
kubectl create namespace web-query-tool
```

### **Step 2: Create ConfigMap**

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-query-tool-config
  namespace: web-query-tool
data:
  ASPNETCORE_ENVIRONMENT: "Production"
  JWT_ISSUER: "WebQueryTool"
  JWT_AUDIENCE: "WebQueryToolClient"
```

```bash
kubectl apply -f k8s/configmap.yaml
```

### **Step 3: Create Secrets**

```bash
# Create secrets from .env file
kubectl create secret generic web-query-tool-secrets \
  --from-env-file=.env \
  --namespace=web-query-tool
```

### **Step 4: Deploy Backend API**

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-query-tool-api
  namespace: web-query-tool
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-query-tool-api
  template:
    metadata:
      labels:
        app: web-query-tool-api
    spec:
      containers:
      - name: api
        image: your-registry/web-query-tool-api:v1.0.0
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: web-query-tool-config
        - secretRef:
            name: web-query-tool-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

```bash
kubectl apply -f k8s/api-deployment.yaml
```

### **Step 5: Deploy Frontend**

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-query-tool-frontend
  namespace: web-query-tool
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-query-tool-frontend
  template:
    metadata:
      labels:
        app: web-query-tool-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/web-query-tool-frontend:v1.0.0
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

### **Step 6: Create Services**

```yaml
# k8s/service.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: web-query-tool-api
  namespace: web-query-tool
spec:
  selector:
    app: web-query-tool-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: web-query-tool-frontend
  namespace: web-query-tool
spec:
  selector:
    app: web-query-tool-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

```bash
kubectl apply -f k8s/service.yaml
```

### **Step 7: Configure Ingress (Optional)**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-query-tool-ingress
  namespace: web-query-tool
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - query-tool.yourdomain.com
    secretName: web-query-tool-tls
  rules:
  - host: query-tool.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: web-query-tool-api
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-query-tool-frontend
            port:
              number: 80
```

```bash
kubectl apply -f k8s/ingress.yaml
```

---

## 🛠️ Manual Deployment

### **Backend (.NET 9 API)**

```bash
# 1. Publish application
cd WebQueryTool/WebQueryTool.API
dotnet publish -c Release -o /var/www/web-query-tool-api

# 2. Install as systemd service
sudo nano /etc/systemd/system/web-query-tool-api.service
```

```ini
[Unit]
Description=Web Query Tool API
After=network.target

[Service]
WorkingDirectory=/var/www/web-query-tool-api
ExecStart=/usr/bin/dotnet /var/www/web-query-tool-api/WebQueryTool.API.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

```bash
# 3. Start service
sudo systemctl enable web-query-tool-api
sudo systemctl start web-query-tool-api
sudo systemctl status web-query-tool-api
```

### **Frontend (Angular)**

```bash
# 1. Build application
cd web-query-tool
npm run build -- --configuration production

# 2. Copy to web server
sudo cp -r dist/web-query-tool/browser/* /var/www/html/

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/web-query-tool
```

```nginx
server {
    listen 80;
    server_name query-tool.yourdomain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 4. Enable site
sudo ln -s /etc/nginx/sites-available/web-query-tool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Security Checklist

- [ ] **HTTPS Enabled**: SSL certificate installed and configured
- [ ] **Firewall Rules**: Only necessary ports exposed (80, 443, 5000)
- [ ] **Database Access**: Restricted to application servers only
- [ ] **JWT Secret**: Strong, random key (min 32 characters)
- [ ] **Environment Variables**: Stored securely, not in code
- [ ] **CORS**: Configured to allow only trusted origins
- [ ] **Rate Limiting**: Implemented to prevent abuse
- [ ] **SQL Injection**: Parameterized queries used throughout
- [ ] **XSS Protection**: Content Security Policy headers set
- [ ] **Dependency Scanning**: Run `npm audit` and `dotnet list package --vulnerable`
- [ ] **Secrets Rotation**: Plan for regular JWT key rotation

---

## 📊 Monitoring & Logging

### **Application Logs**

```bash
# Docker
docker-compose logs -f api
docker-compose logs -f frontend

# Kubernetes
kubectl logs -f deployment/web-query-tool-api -n web-query-tool
kubectl logs -f deployment/web-query-tool-frontend -n web-query-tool

# Systemd
sudo journalctl -u web-query-tool-api -f
```

### **Health Checks**

```bash
# API Health
curl http://localhost:5000/health

# Frontend Health
curl http://localhost:80/health

# SignalR Hub
curl http://localhost:5000/hubs/query-execution
```

### **Performance Monitoring**

Recommended tools:
- **Application Insights** (Azure)
- **Prometheus + Grafana** (Self-hosted)
- **Datadog** (SaaS)
- **New Relic** (SaaS)

---

## 🐛 Troubleshooting

### **Issue: API Not Starting**

```bash
# Check logs
docker-compose logs api

# Common causes:
# 1. Invalid connection string
# 2. Port already in use
# 3. Missing environment variables

# Solution:
# Verify .env file
# Check port availability: netstat -tulpn | grep 5000
```

### **Issue: CORS Errors**

```bash
# Symptom: "Access to XMLHttpRequest has been blocked by CORS policy"

# Solution 1: Verify CORS configuration in Program.cs
# Solution 2: Check frontend API URL in environment.ts
# Solution 3: Ensure AllowCredentials is set (required for SignalR)
```

### **Issue: SignalR Connection Fails**

```bash
# Check:
# 1. SignalR hub is registered in Program.cs
# 2. CORS allows credentials
# 3. WebSocket protocol is enabled

# Test SignalR endpoint:
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:5000/hubs/query-execution
```

### **Issue: Database Connection Fails**

```bash
# Test connection
dotnet user-secrets set "ConnectionStrings:PostgreSQL" "your-connection-string"
dotnet run

# Common causes:
# 1. Firewall blocking database port
# 2. Incorrect credentials
# 3. SSL/TLS requirements

# Solution: Test connection from command line first
psql -h hostname -U username -d database
```

---

## 📞 Support

For deployment issues:
- GitHub Issues: [repository-url]/issues
- Documentation: README.md, PROJECT_SUMMARY.md
- Email: support@yourdomain.com

---

**Deployment completed successfully? Great! 🎉**

**Next steps:**
1. Configure user authentication
2. Set up monitoring and alerts
3. Create backup strategy
4. Document operational procedures
