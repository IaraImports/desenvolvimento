# Como Resolver o Erro do Índice do Firebase

## Problema
Erro: "The query requires an index. You can create it here: https://console.firebase.google.com/..."

## Solução Rápida (Temporária)
Por enquanto, removi o `orderBy` da query para evitar o erro. O sistema funcionará normalmente.

## Solução Definitiva
Para habilitar a ordenação por data, siga estes passos:

### 1. Acesse o Firebase Console
Vá para: https://console.firebase.google.com/

### 2. Selecione seu Projeto
Escolha o projeto "appgestaoiara"

### 3. Acesse Firestore Database
Clique em "Firestore Database" no menu lateral

### 4. Vá para Índices
Clique na aba "Índices" (Indexes)

### 5. Crie os Índices Compostos
Clique em "Criar índice" e adicione:

**Para Produtos:**
- Coleção: `produtos`
- Campos:
  - `userId` (Crescente)
  - `createdAt` (Decrescente)

**Para Serviços:**
- Coleção: `servicos`
- Campos:
  - `userId` (Crescente)
  - `createdAt` (Decrescente)

**Para Vendas:**
- Coleção: `vendas`
- Campos:
  - `userId` (Crescente)
  - `createdAt` (Decrescente)

**Para Clientes:**
- Coleção: `clientes`
- Campos:
  - `userId` (Crescente)
  - `createdAt` (Decrescente)

### 6. Aguarde a Criação
Os índices levam alguns minutos para serem criados.

### 7. Reativar OrderBy
Após os índices serem criados, você pode reativar o orderBy no arquivo `src/config/firebase.js`:

```javascript
export const getDocumentsByUser = (collectionName, userId) => {
  const q = query(
    collection(db, collectionName), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')  // ← Descomente esta linha
  );
  return getDocs(q);
};
```

## Status Atual
✅ Sistema funcionando sem ordenação
⏳ Aguardando criação dos índices para habilitar ordenação 