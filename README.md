# Alunos
- Eric Gabriel Caetano
- Felipe da Silva Chawischi
- Gabriel Felipe Alves Bandoch
- João Guilherme Tamanini Dalmarco

# Algoritmo Genético — Problema da Mochila

Trabalho da Unidade 2 de Algoritmos Avançados. A ideia é resolver o problema da mochila usando um algoritmo genético, com um backend em Python e um frontend em React pra mostrar os resultados.

---

## Como rodar

Você vai precisar de dois terminais abertos ao mesmo tempo — um pro backend e um pro frontend.

### Backend (Python)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

O servidor vai subir em `http://localhost:5000`. Deixa esse terminal aberto.

### Frontend (React)

```bash
cd frontend
npm install
npm install recharts
npm run dev
```

Acesse `http://localhost:3000` no navegador.

> ⚠️ Se der erro no `npm install`, verifique se seu Node.js é v20.19 ou superior. Se não for, use `npm create vite@5` na hora de criar o projeto.

---

## Estrutura do projeto

```
├── backend/
│   ├── app.py              # algoritmo genético + API em Flask
│   └── requirements.txt
│
└── frontend/
    └── src/
        └── App.jsx         # interface em React
```

---

## Como o algoritmo funciona

Cada solução possível é representada por um **cromossomo binário** de 6 bits, um bit por item:

```
[1, 0, 1, 0, 1, 0]
 │  │  │  │  │  └── Comida        → não leva
 │  │  │  │  └───── Garrafa       → leva
 │  │  │  └──────── Tocha         → não leva
 │  │  └─────────── Canivete      → leva
 │  └────────────── Corda         → não leva
 └───────────────── Saco de Dormir → leva
```

O algoritmo segue esses passos a cada geração:

1. **População inicial** — cria vários cromossomos aleatórios
2. **Fitness** — calcula a pontuação de cada um (penaliza se passar de 30kg)
3. **Seleção** — escolhe os melhores pais via torneio (pega 3 aleatórios, fica com o melhor)
4. **Crossover** — combina dois pais cortando o cromossomo num ponto aleatório
5. **Mutação** — inverte alguns bits aleatoriamente (evita ficar preso num mínimo local)
6. **Elitismo** — os N melhores passam direto pra próxima geração sem alteração

Isso se repete pelo número de gerações configurado. No final o frontend mostra o melhor cromossomo encontrado e um gráfico com a evolução do fitness ao longo das gerações.
