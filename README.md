# 🚀 IARA HUB - Sistema de Gestão Particular

![IARA HUB](https://img.shields.io/badge/IARA%20HUB-Sistema%20Particular-FF2C68?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Database-ffaa00?style=for-the-badge&logo=firebase)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8?style=for-the-badge&logo=tailwind-css)

Um sistema de gestão empresarial ultra moderno e luxuoso, com design premium em tons de **preto, rosa e branco**. Construído com as mais avançadas tecnologias web e integração completa com Firebase.

## ✨ Design Premium

- **🎨 UI/UX Luxuosa**: Interface glassmorphism com animações fluidas
- **🌈 Esquema de Cores**: Preto elegante, rosa vibrante e branco puro
- **💫 Animações Avançadas**: Framer Motion para transições suaves
- **📱 Responsivo**: Perfeita adaptação para todos os dispositivos
- **🔮 Glassmorphism**: Efeitos de vidro e transparência modernos

## 🚀 Tecnologias de Última Geração

### Frontend
- **React 18** - Framework JavaScript moderno
- **Vite** - Build tool super rápido
- **Tailwind CSS** - Framework CSS utilitário
- **Framer Motion** - Biblioteca de animações
- **Lucide React** - Ícones modernos
- **React Hot Toast** - Notificações elegantes
- **Recharts** - Gráficos interativos

### Backend & Autenticação
- **Firebase Authentication** - Login seguro
- **Firestore Database** - Banco de dados NoSQL
- **Firebase Hosting** - Deploy em nuvem
- **Google OAuth** - Login com Google

## 🛠️ Configuração do Projeto

### 1. Pré-requisitos
```bash
Node.js 18+ e npm/yarn
Conta no Firebase
Git
```

### 2. Instalação
```bash
# Clone o repositório
git clone [url-do-repositorio]
cd gestao-pro

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### 3. Configuração do Firebase

#### 3.1 Criar Projeto no Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar projeto"
3. Nomeie seu projeto (ex: "gestao-pro")
4. Ative o Google Analytics (opcional)

#### 3.2 Configurar Authentication
1. No console Firebase, vá em **Authentication**
2. Clique em **Começar**
3. Na aba **Sign-in method**, ative:
   - **Email/senha**
   - **Google** (opcional)

#### 3.3 Configurar Firestore Database
1. Vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Iniciar no modo de teste**
4. Selecione a localização (preferencialmente `us-central1`)

#### 3.4 Obter Credenciais
1. Vá em **Configurações do projeto** (ícone de engrenagem)
2. Na aba **Geral**, role até **Seus aplicativos**
3. Clique em **Web** (`</>`)
4. Registre o app com nome "IARA HUB Web"
5. Copie as credenciais fornecidas

#### 3.5 Configurar no Projeto
Edite o arquivo `src/config/firebase.js` e substitua as credenciais:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id-aqui"
};
```

#### 3.6 Regras de Segurança do Firestore
No Firebase Console, vá em **Firestore Database > Regras** e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem acessar seus próprios dados
    match /{collection}/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Permitir criação de documentos com userId do usuário autenticado
    match /{collection}/{document} {
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 🎯 Funcionalidades Premium

### 🏪 Dashboard Inteligente
- **Métricas em Tempo Real**: Receita, vendas, produtos, clientes
- **Gráficos Interativos**: Line, Bar e Pie charts
- **Alertas de Estoque**: Produtos com baixo estoque
- **Vendas Recentes**: Histórico das últimas transações

### 📦 Gestão de Produtos
- ✅ **CRUD Completo**: Criar, ler, atualizar, deletar
- ✅ **Categorização**: Organização por categorias
- ✅ **Controle de Estoque**: Monitoramento em tempo real
- ✅ **Busca Avançada**: Filtros inteligentes
- ✅ **Upload de Imagens**: Fotos dos produtos

### 💰 Sistema de Vendas
- ✅ **Carrinho de Compras**: Interface intuitiva
- ✅ **Seleção de Clientes**: Gestão completa
- ✅ **Múltiplas Formas de Pagamento**: Dinheiro, cartão, PIX
- ✅ **Histórico Completo**: Todas as vendas registradas
- ✅ **Impressão de Recibos**: Comprovantes elegantes

### 🔄 Em Desenvolvimento
- 🚧 **Gestão de Serviços**: Cadastro e controle de serviços
- 🚧 **CRM Completo**: Gestão avançada de clientes
- 🚧 **Relatórios BI**: Business Intelligence com IA
- 🚧 **Configurações**: Personalização completa do sistema

## 🎨 Paleta de Cores

```css
/* Cores Principais */
Rosa Principal: #ec4899
Preto Elegante: #0f172a
Branco Puro: #ffffff

/* Gradientes */
Luxury: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #ec4899 100%)
Pink: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)
Dark: linear-gradient(135deg, #0f172a 0%, #1e293b 100%)
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build
npm run lint         # Verificação de código
```

## 🚀 Deploy

### Firebase Hosting
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar hosting
firebase init hosting

# Build do projeto
npm run build

# Deploy
firebase deploy
```

## 📱 Screenshots

### Tela de Login
- Autenticação elegante com glassmorphism
- Login com email/senha e Google
- Animações suaves de entrada

### Dashboard
- Métricas em tempo real
- Gráficos interativos coloridos
- Cards com efeitos de hover

### Gestão de Produtos
- Interface moderna e intuitiva
- Modais com animações
- Tabelas responsivas

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🌟 Autor

Desenvolvido com 💖 por **Sua Equipe**

---

**IARA HUB** - Sistema particular de gestão inteligente ✨

![Footer](https://img.shields.io/badge/Made%20with-❤️%20and%20☕-ec4899?style=for-the-badge) 