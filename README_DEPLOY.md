# 🚀 Deploy no Vercel - IARA HUB

## 📋 Pré-requisitos

✅ Projeto React/Vite configurado  
✅ Firebase configurado  
✅ Conta no GitHub  
✅ Conta no Vercel (vercel.com)

## 🛠️ Passos para Deploy

### 1. **Preparar Repositório GitHub**

```bash
# Fazer commit de todas as alterações
git add .
git commit -m "feat: prepare for vercel deployment"

# Fazer push para o GitHub
git push origin main
```

### 2. **Conectar no Vercel**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Import Project"**
4. Selecione seu repositório **iara-hub**
5. Configure as seguintes opções:

**Build Settings:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. **⚠️ IMPORTANTE: Configurar Variáveis de Ambiente**

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```
VITE_FIREBASE_API_KEY=AIzaSyCx1wUZmMB9WjHNCwVxSy4js9puiIb98to
VITE_FIREBASE_AUTH_DOMAIN=appgestaoiara.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=appgestaoiara
VITE_FIREBASE_STORAGE_BUCKET=appgestaoiara.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=281800566900
VITE_FIREBASE_APP_ID=1:281800566900:web:4fcb6a4ce12e391fc70921
VITE_FIREBASE_MEASUREMENT_ID=G-ET0H50Y5G5
```

**Adicione também (opcionais):**
```
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_APP_DEBUG=false
```

### 4. **Deploy**

1. Clique em **"Deploy"**
2. Aguarde o processo de build (3-5 minutos)
3. ✅ Seu app estará disponível em: `https://seu-projeto.vercel.app`

## 🔧 Configurações de Produção

### Domínio Personalizado (Opcional)

1. No painel Vercel, vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções do Vercel

### Firebase - Autorizar Domínio

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Vá em **Authentication > Settings > Authorized domains**
3. Adicione seu domínio Vercel: `seu-projeto.vercel.app`

### Performance Monitoring

1. No Firebase Console, ative **Performance Monitoring**
2. No código, já está configurado para produção

## 🔄 Deploy Automático

Configurado para deploy automático a cada push na branch `main`:

- ✅ **Desenvolvimento**: Push para `dev` → Preview deploy
- ✅ **Produção**: Push para `main` → Production deploy

## 📊 Monitoramento

**Vercel Analytics:**
- Acesse **Analytics** no painel Vercel
- Monitore performance e tráfego

**Firebase Analytics:**
- Dados em tempo real no Firebase Console
- Eventos de usuário automáticos

## 🚨 Solução de Problemas

### Erro de Build
```bash
# Testar build local
npm run build
npm run preview
```

### Erro de Firebase
- Verificar variáveis de ambiente no Vercel
- Confirmar domínio autorizado no Firebase

### Problemas de Roteamento
- ✅ Já configurado no `vercel.json` com rewrites

## 📱 PWA (Progressive Web App)

O app já está configurado como PWA:
- ✅ Service Worker
- ✅ Manifesto
- ✅ Instalável no celular

## 🔐 Segurança

**Configurações aplicadas:**
- ✅ HTTPS automático (Vercel)
- ✅ Variáveis de ambiente seguras
- ✅ Headers de segurança
- ✅ Autenticação Firebase

## 📝 Comandos Úteis

```bash
# Deploy manual (se necessário)
vercel --prod

# Ver logs em tempo real
vercel logs

# Reverter deploy
vercel rollback

# Configurar projeto local
vercel link
```

## 🎯 URLs do Projeto

**Desenvolvimento:** http://localhost:5173/  
**Produção:** https://seu-projeto.vercel.app  
**Firebase:** https://console.firebase.google.com/project/appgestaoiara

---

## ✨ Resultado Final

Após o deploy, você terá:

- 🚀 **App em produção** com domínio HTTPS
- 📱 **PWA instalável** no celular
- 🔄 **Deploy automático** a cada commit
- 📊 **Analytics e monitoramento**
- 🔐 **Autenticação funcionando**
- 💾 **Banco de dados Firebase**
- 📁 **Upload de arquivos**
- 🎨 **Interface responsiva**

**IARA HUB rodando em produção! 🎉** 