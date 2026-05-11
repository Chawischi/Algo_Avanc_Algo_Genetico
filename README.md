# 🎒 Knapsack Genético — Python + React

Solução full-stack para o **Problema da Mochila (Knapsack Problem)** com:
- **Backend**: Python + Flask com o Algoritmo Genético completo
- **Frontend**: React + Recharts com interface visual interativa

---

## 🗂 Estrutura do Projeto

```
knapsack-full/
│
├── backend/
│   ├── app.py              ← Algoritmo Genético + API Flask
│   └── requirements.txt    ← Dependências Python
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── App.jsx         ← Interface React completa
│
└── README.md
```

---

## 🚀 Como Executar

### 1. Backend (Python / Flask)

```bash
cd backend

# Criar ambiente virtual (recomendado)
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor
python app.py
```

O servidor sobe em **http://localhost:5000**

---

### 2. Frontend (React / Vite)

Em outro terminal:

```bash
cd frontend

npm install
npm run dev
```

O frontend estará em **http://localhost:3000**

---

## 🔌 API Endpoints

### `GET /api/items`
Retorna os itens disponíveis e a capacidade da mochila.

```json
{
  "capacity": 30,
  "items": [
    { "name": "Saco de Dormir", "icon": "🛌", "weight": 15, "score": 15 },
    ...
  ]
}
```

### `POST /api/run`
Executa o algoritmo genético com os parâmetros fornecidos.

**Request body:**
```json
{
  "pop_size": 50,
  "n_generations": 100,
  "mutation_rate": 0.05,
  "crossover_rate": 0.80,
  "elite_n": 2
}
```

**Response:**
```json
{
  "best_chromosome": [0, 1, 1, 0, 1, 0],
  "best_fitness": 25.0,
  "best_weight": 14,
  "best_score": 25,
  "selected_items": [...],
  "valid": true,
  "history": [
    { "generation": 1, "best_fitness": 18.0, "avg_fitness": 11.3 },
    ...
  ],
  "generation_log": [...],
  "elapsed_seconds": 0.042,
  "params": { ... }
}
```

### `GET /api/health`
Verifica se o backend está funcionando.

---

## 🧬 Algoritmo Genético — Detalhes

### Representação Genética
Cromossomo binário de 6 bits — um por item:
```
[1, 0, 1, 0, 1, 0]
 │  │  │  │  │  └── Comida        (não leva)
 │  │  │  │  └───── Garrafa       (leva)
 │  │  │  └──────── Tocha         (não leva)
 │  │  └─────────── Canivete      (leva)
 │  └────────────── Corda         (não leva)
 └───────────────── Saco de Dormir (leva)
```

### Itens e Capacidade

| Item | Peso (kg) | Pontuação |
|---|---|---|
| Saco de Dormir | 15 | 15 |
| Corda | 3 | 7 |
| Canivete | 2 | 10 |
| Tocha | 5 | 5 |
| Garrafa | 9 | 8 |
| Comida | 20 | 17 |

**Capacidade máxima:** 30 kg

### Etapas implementadas em `app.py`

#### 1. `initial_population(pop_size)`
Gera `pop_size` cromossomos aleatórios.

#### 2. `fitness(chromosome)`
- Soma os pontos dos itens selecionados.
- Se o peso exceder 30 kg, aplica penalidade: `score - excess * 3`.
- Garante que fitness ≥ 0.

#### 3. `tournament_select(population, fit_values, k=3)`
Seleção por torneio com k=3: sorteia 3 indivíduos e retorna o melhor.

#### 4. `crossover(parent_a, parent_b, rate)`
Crossover de 1 ponto: corta em posição aleatória e troca as caudas.

#### 5. `mutate(chromosome, rate)`
Bit-flip: cada gene tem probabilidade `rate` de ser invertido.

#### 6. Elitismo
Os `elite_n` melhores indivíduos são copiados diretamente para a próxima geração.

#### 7. `genetic_algorithm(...)` — Loop principal
```
Para cada geração:
  1. Avalia todos os indivíduos (fitness)
  2. Preserva elite_n melhores (elitismo)
  3. Repete até completar a nova população:
     a. Seleção por torneio de 2 pais
     b. Crossover de 1 ponto
     c. Mutação bit-flip em cada filho
  4. Registra estatísticas da geração
```

### Parâmetros Configuráveis

| Parâmetro | Padrão | Faixa | Descrição |
|---|---|---|---|
| `pop_size` | 50 | 10–200 | Indivíduos por geração |
| `n_generations` | 100 | 20–500 | Iterações do AG |
| `mutation_rate` | 5% | 1–30% | Prob. de inverter um gene |
| `crossover_rate` | 80% | 50–100% | Prob. de cruzar dois pais |
| `elite_n` | 2 | 0–10 | Melhores preservados |

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|---|---|
| Algoritmo | Python 3.10+ |
| API | Flask 3 + Flask-CORS |
| Frontend | React 18 |
| Gráficos | Recharts |
| Build | Vite 5 |
| Fontes | Syne + JetBrains Mono |