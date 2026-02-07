# 🚀 Guia de Deploy no Cloudflare - Simulador de Importação Pro

## 📋 Pré-requisitos

- ✅ Conta Cloudflare ativa
- ✅ Domínio `renatoalvesfilho.com.br` configurado no Cloudflare
- ✅ Repositório GitHub com o código do projeto
- ✅ Node.js 22+ e pnpm instalados localmente

---

## 🎯 Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│                  Cloudflare Global Network              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cloudflare Pages (Frontend + API Routes)        │  │
│  │  - React 19 SPA                                  │  │
│  │  - tRPC API via Workers                          │  │
│  │  - Cache KV para NCMs                            │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers (Backend)                    │  │
│  │  - Lógica de negócio                             │  │
│  │  - Autenticação OAuth                            │  │
│  │  - Cálculos de impostos                          │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Banco de Dados Externo                          │  │
│  │  - TiDB Cloud (MySQL compatível)                 │  │
│  │  - Ou Supabase (PostgreSQL)                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Passo 1: Preparar o Repositório GitHub

### 1.1 Criar repositório no GitHub

```bash
# Se ainda não tiver um repositório
git init
git add .
git commit -m "Initial commit: Simulador de Importação Pro"
git branch -M main
git remote add origin https://github.com/seu-usuario/simulador-importacao.git
git push -u origin main
```

### 1.2 Estrutura esperada do repositório

```
simulador-importacao/
├── client/                 # Frontend React
├── server/                 # Backend Node.js
├── drizzle/               # Migrações de banco de dados
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── wrangler.toml          # Configuração Cloudflare Workers
└── wrangler-pages.toml    # Configuração Cloudflare Pages
```

---

## 🔧 Passo 2: Configurar Banco de Dados Permanente

### Opção A: TiDB Cloud (Recomendado)

1. Acesse [tidb.cloud](https://tidb.cloud)
2. Crie uma conta gratuita
3. Crie um cluster TiDB
4. Copie a string de conexão MySQL
5. Salve em local seguro

**String de conexão exemplo:**
```
mysql://usuario:senha@host.tidb.cloud:4000/comex_db?sslMode=require
```

### Opção B: Supabase (PostgreSQL)

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a string de conexão PostgreSQL
4. Salve em local seguro

**String de conexão exemplo:**
```
postgresql://postgres:senha@db.supabase.co:5432/postgres
```

---

## 🌐 Passo 3: Configurar Cloudflare Pages

### 3.1 Conectar repositório GitHub

1. Acesse o painel do Cloudflare
2. Vá para **Pages**
3. Clique em **Create a project**
4. Selecione **Connect to Git**
5. Autorize o Cloudflare a acessar seu GitHub
6. Selecione o repositório `simulador-importacao`
7. Clique em **Begin setup**

### 3.2 Configurar build

Na tela de configuração:

- **Project name:** `simulador-importacao`
- **Production branch:** `main`
- **Build command:** `pnpm build`
- **Build output directory:** `dist/public`
- **Root directory:** `/` (deixar em branco)

### 3.3 Adicionar variáveis de ambiente

Clique em **Environment variables** e adicione:

```
VITE_API_URL = https://simulador.renatoalvesfilho.com.br/api
NODE_ENV = production
```

### 3.4 Adicionar secrets (variáveis secretas)

Clique em **Secrets** e adicione:

```
DATABASE_URL = mysql://usuario:senha@host:porta/banco
OAUTH_SERVER_URL = https://seu-oauth-server.com
```

### 3.5 Deploy inicial

Clique em **Save and Deploy**. O Cloudflare iniciará o build e deploy automaticamente.

---

## 🔗 Passo 4: Configurar Domínio Personalizado

### 4.1 No painel do Cloudflare

1. Vá para **Pages** → Seu projeto
2. Clique em **Settings** → **Domains**
3. Clique em **Add domain**
4. Digite: `simulador.renatoalvesfilho.com.br`
5. Clique em **Activate domain**

### 4.2 Configurar DNS

O Cloudflare fornecerá um CNAME. Você precisa:

1. Ir para o painel de DNS do seu registrador (ou do Cloudflare se usar nameservers)
2. Criar um registro CNAME:
   - **Nome:** `simulador`
   - **Alvo:** `seu-projeto.pages.dev`
   - **TTL:** Auto
3. Salvar

### 4.3 Ativar SSL/TLS

1. No painel do Cloudflare, vá para **SSL/TLS**
2. Selecione **Full** (recomendado)
3. Isso é automático e gratuito!

---

## 🚀 Passo 5: Configurar Backend com Cloudflare Workers

### 5.1 Instalar Wrangler CLI

```bash
npm install -g wrangler
```

### 5.2 Autenticar com Cloudflare

```bash
wrangler login
```

### 5.3 Criar Worker para o backend

```bash
wrangler publish
```

### 5.4 Configurar rota do Worker

1. No painel do Cloudflare
2. Vá para **Workers** → **Routes**
3. Crie uma rota:
   - **Route:** `simulador.renatoalvesfilho.com.br/api/*`
   - **Worker:** `simulador-importacao`

---

## 🔄 Passo 6: Deploy Contínuo (CI/CD)

### 6.1 Configurar GitHub Actions

Crie o arquivo `.github/workflows/deploy-cloudflare.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: simulador-importacao
          directory: dist/public
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 6.2 Adicionar secrets no GitHub

1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Adicione:
   - `CLOUDFLARE_API_TOKEN` (gere em Cloudflare → API Tokens)
   - `CLOUDFLARE_ACCOUNT_ID` (encontre em Cloudflare → Account)

---

## ✅ Passo 7: Validar o Deploy

### 7.1 Verificar se o site está online

```bash
# Verificar se responde
curl -I https://simulador.renatoalvesfilho.com.br

# Deve retornar: HTTP/2 200
```

### 7.2 Testar funcionalidades

1. Acesse `https://simulador.renatoalvesfilho.com.br`
2. Teste criar uma simulação
3. Teste buscar uma NCM
4. Verifique se os dados são salvos

### 7.3 Verificar SSL/TLS

1. Abra o site no navegador
2. Clique no cadeado 🔒 ao lado da URL
3. Deve mostrar "Conexão segura"

---

## 🔍 Troubleshooting

### Site não carrega

```bash
# Verificar logs do Cloudflare Pages
wrangler tail

# Verificar build logs
# No painel do Cloudflare → Pages → Seu projeto → Deployments
```

### Erro de banco de dados

```bash
# Verificar conectividade
mysql -h seu-host -u usuario -p -e "SELECT 1;"

# Verificar variáveis de ambiente
# No painel do Cloudflare → Pages → Settings → Environment variables
```

### Domínio não funciona

```bash
# Verificar DNS
nslookup simulador.renatoalvesfilho.com.br

# Deve retornar o CNAME do Cloudflare
```

---

## 📊 Monitoramento

### Acessar analytics

1. No painel do Cloudflare
2. Vá para **Analytics**
3. Veja:
   - Requisições por dia
   - Taxa de erro
   - Performance
   - Geolocalização dos usuários

### Configurar alertas

1. Vá para **Notifications**
2. Crie alertas para:
   - Taxa de erro > 1%
   - Tempo de resposta > 1s
   - Falha de deploy

---

## 🔐 Segurança

### Checklist de Segurança

- ✅ SSL/TLS ativado (HTTPS)
- ✅ Rate limiting configurado
- ✅ WAF (Web Application Firewall) ativado
- ✅ DDoS protection ativado
- ✅ Secrets não expostos no código
- ✅ Backups do banco de dados configurados

### Ativar WAF

1. No painel do Cloudflare
2. Vá para **Security** → **WAF**
3. Ative as regras recomendadas

---

## 📈 Próximos Passos

1. **Monitorar performance** - Use o Cloudflare Analytics
2. **Otimizar cache** - Configure cache rules para assets estáticos
3. **Escalar** - Se tiver muitos usuários, considere Cloudflare Workers KV
4. **Backup** - Configure backups automáticos do banco de dados

---

## 📞 Suporte

- Documentação Cloudflare: https://developers.cloudflare.com/pages/
- Suporte Cloudflare: https://support.cloudflare.com
- Manus Help: https://help.manus.im

---

**Versão:** 1.0  
**Data:** 07 de Fevereiro de 2026  
**Status:** ✅ Pronto para Deploy
