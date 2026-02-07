# 🚀 Guia de Implantação em Produção - Simulador de Importação Pro

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Opções de Implantação](#opções-de-implantação)
4. [Implantação com Docker](#implantação-com-docker)
5. [Configuração de Domínio e SSL](#configuração-de-domínio-e-ssl)
6. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
7. [Backup e Recuperação](#backup-e-recuperação)

---

## 🎯 Visão Geral

O **Simulador de Importação Pro** é uma aplicação web full-stack que requer:
- **Frontend:** React 19 com TypeScript
- **Backend:** Node.js com Express e tRPC
- **Banco de Dados:** MySQL 8.0+
- **Servidor Web:** Nginx (reverse proxy)

Esta documentação fornece instruções passo a passo para implantar o sistema em produção de forma segura e escalável.

---

## ✅ Pré-requisitos

Antes de começar, você precisará ter:

1. **Servidor Linux** (Ubuntu 20.04+ ou CentOS 8+)
2. **Docker e Docker Compose** instalados
3. **Domínio próprio** com acesso ao DNS
4. **Certificado SSL/TLS** (pode ser obtido gratuitamente via Let's Encrypt)
5. **Credenciais de OAuth** (para autenticação de usuários)

### Instalação de Dependências

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose curl wget git

# CentOS
sudo yum install -y docker docker-compose curl wget git

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 🏗️ Opções de Implantação

### Opção 1: Docker Compose (Recomendado)
- ✅ Mais fácil de configurar
- ✅ Inclui banco de dados e Nginx
- ✅ Ideal para pequenos e médios projetos
- ⏱️ Tempo de setup: 15-20 minutos

### Opção 2: Kubernetes
- ✅ Escalabilidade automática
- ✅ Alta disponibilidade
- ⚠️ Mais complexo de configurar
- ⏱️ Tempo de setup: 1-2 horas

### Opção 3: Plataformas Gerenciadas
- ✅ Vercel, Netlify (frontend)
- ✅ AWS, Google Cloud, DigitalOcean (backend)
- ✅ Sem necessidade de gerenciar infraestrutura
- ⏱️ Tempo de setup: 30-45 minutos

---

## 🐳 Implantação com Docker (Recomendado)

### Passo 1: Preparar o Servidor

```bash
# Clonar ou fazer download do projeto
git clone https://seu-repositorio.git /opt/comex-simulator
cd /opt/comex-simulator

# Criar diretórios necessários
mkdir -p ssl logs
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.docker .env

# Editar com suas configurações
nano .env

# Valores importantes a configurar:
# - DB_ROOT_PASSWORD: Senha do root do MySQL
# - DB_PASSWORD: Senha do usuário da aplicação
# - OAUTH_SERVER_URL: URL do seu servidor OAuth
# - APP_URL: URL de produção (ex: https://comex.exemplo.com)
```

### Passo 3: Configurar SSL/TLS

#### Opção A: Let's Encrypt (Gratuito)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com

# Copiar certificados para o projeto
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### Opção B: Certificado Próprio

```bash
# Gerar certificado auto-assinado (apenas para testes)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

### Passo 4: Construir e Iniciar os Containers

```bash
# Build das imagens
docker-compose build

# Iniciar os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### Passo 5: Verificar Saúde da Aplicação

```bash
# Verificar se a aplicação está respondendo
curl https://localhost/healthz

# Acessar a aplicação
# Abra seu navegador em: https://seu-dominio.com
```

---

## 🌐 Configuração de Domínio e SSL

### Atualizar DNS

Adicione os seguintes registros ao seu provedor de DNS:

```
Tipo    Nome                    Valor
A       seu-dominio.com         seu-ip-servidor
CNAME   www.seu-dominio.com     seu-dominio.com
```

### Renovação Automática de Certificados

```bash
# Criar cron job para renovação automática
sudo crontab -e

# Adicionar linha:
0 3 * * * certbot renew --quiet && docker-compose -f /opt/comex-simulator/docker-compose.yml restart nginx
```

---

## 📊 Monitoramento e Manutenção

### Health Check

```bash
# Verificar saúde da aplicação
./scripts/healthcheck.sh

# Ver logs em tempo real
docker-compose logs -f app

# Ver logs do Nginx
docker-compose logs -f nginx

# Ver logs do MySQL
docker-compose logs -f db
```

### Métricas Importantes

Monitore os seguintes indicadores:

| Métrica | Alerta | Crítico |
|---------|--------|---------|
| CPU | > 70% | > 90% |
| Memória | > 75% | > 90% |
| Disco | > 80% | > 95% |
| Tempo de Resposta | > 1s | > 5s |
| Taxa de Erro | > 1% | > 5% |

### Ferramentas de Monitoramento

```bash
# Prometheus + Grafana (recomendado)
docker run -d --name prometheus prom/prometheus

# ELK Stack (Elasticsearch, Logstash, Kibana)
docker run -d --name elasticsearch docker.elastic.co/elasticsearch/elasticsearch:8.0.0
```

---

## 💾 Backup e Recuperação

### Backup Automático do Banco de Dados

```bash
# Criar script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/comex"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T db mysqldump -u comex_user -pcomex_pass comex_db > $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "✅ Backup criado: $BACKUP_DIR/backup_$DATE.sql"
EOF

chmod +x backup.sh

# Agendar backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/comex-simulator/backup.sh") | crontab -
```

### Restaurar de Backup

```bash
# Restaurar banco de dados
docker-compose exec -T db mysql -u comex_user -pcomex_pass comex_db < /backups/comex/backup_YYYYMMDD_HHMMSS.sql

# Reiniciar aplicação
docker-compose restart app
```

---

## 🔐 Segurança

### Checklist de Segurança

- ✅ SSL/TLS configurado (HTTPS)
- ✅ Senhas fortes para banco de dados
- ✅ Firewall configurado (apenas portas 80, 443)
- ✅ Rate limiting ativado no Nginx
- ✅ Headers de segurança configurados
- ✅ Backups automáticos ativados
- ✅ Logs centralizados
- ✅ Monitoramento ativo

### Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🆘 Troubleshooting

### A aplicação não inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar conectividade com banco de dados
docker-compose exec app npm run db:push

# Reiniciar tudo
docker-compose down
docker-compose up -d
```

### Banco de dados não conecta

```bash
# Verificar status do MySQL
docker-compose logs db

# Reiniciar banco de dados
docker-compose restart db

# Verificar credenciais em .env
cat .env | grep DB_
```

### Certificado SSL expirado

```bash
# Renovar certificado
sudo certbot renew

# Copiar novo certificado
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ssl/key.pem

# Reiniciar Nginx
docker-compose restart nginx
```

---

## 📈 Escalabilidade

### Aumentar Recursos

```bash
# Aumentar limite de memória
docker-compose.yml:
  app:
    mem_limit: 2g
    memswap_limit: 4g
```

### Load Balancing

```bash
# Adicionar múltiplas instâncias da aplicação
docker-compose up -d --scale app=3
```

---

## 📞 Suporte

Para dúvidas ou problemas, acesse: https://help.manus.im

---

**Versão:** 1.0  
**Data:** 07 de Fevereiro de 2026  
**Status:** ✅ Pronto para Produção
