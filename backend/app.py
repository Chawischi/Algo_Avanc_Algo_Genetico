"""
Algoritmo Genético — Problema da Mochila (Knapsack Problem)
Backend Flask com API REST
"""

import random
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# Dados do problema
# ─────────────────────────────────────────────
ITEMS = [
    {"name": "Saco de Dormir", "icon": "🛌", "weight": 15, "score": 15},
    {"name": "Corda",          "icon": "🪢", "weight":  3, "score":  7},
    {"name": "Canivete",       "icon": "🔪", "weight":  2, "score": 10},
    {"name": "Tocha",          "icon": "🔦", "weight":  5, "score":  5},
    {"name": "Garrafa",        "icon": "🍶", "weight":  9, "score":  8},
    {"name": "Comida",         "icon": "🥫", "weight": 20, "score": 17},
]
CAPACITY = 30
N_ITEMS = len(ITEMS)


# ─────────────────────────────────────────────
# REPRESENTAÇÃO GENÉTICA
# Cromossomo: lista binária de comprimento N_ITEMS
# Exemplo: [1, 0, 1, 0, 1, 0]
# ─────────────────────────────────────────────

def random_chromosome() -> list[int]:
    """Gera um cromossomo binário aleatório."""
    return [random.randint(0, 1) for _ in range(N_ITEMS)]


def initial_population(pop_size: int) -> list[list[int]]:
    """Cria a população inicial com indivíduos aleatórios."""
    return [random_chromosome() for _ in range(pop_size)]


# ─────────────────────────────────────────────
# FUNÇÃO DE FITNESS
# ─────────────────────────────────────────────

def fitness(chromosome: list[int]) -> float:
    """
    Calcula o fitness de um cromossomo.
    - Maximiza a pontuação de sobrevivência.
    - Penaliza soluções que excedam a capacidade (peso > 30 kg).
    """
    total_weight = sum(chromosome[i] * ITEMS[i]["weight"] for i in range(N_ITEMS))
    total_score  = sum(chromosome[i] * ITEMS[i]["score"]  for i in range(N_ITEMS))

    if total_weight > CAPACITY:
        # Penalidade proporcional ao excesso de peso
        excess = total_weight - CAPACITY
        return max(0, total_score - excess * 3)

    return float(total_score)


def evaluate_population(population: list[list[int]]) -> list[float]:
    """Avalia toda a população, retornando uma lista de fitness."""
    return [fitness(ind) for ind in population]


# ─────────────────────────────────────────────
# SELEÇÃO — Torneio
# ─────────────────────────────────────────────

def tournament_select(
    population: list[list[int]],
    fit_values: list[float],
    k: int = 3
) -> list[int]:
    """
    Seleção por torneio:
    - Escolhe k indivíduos aleatórios.
    - Retorna o de maior fitness.
    """
    candidates = random.sample(range(len(population)), k)
    winner = max(candidates, key=lambda idx: fit_values[idx])
    return population[winner]


# ─────────────────────────────────────────────
# CROSSOVER — Um ponto
# ─────────────────────────────────────────────

def crossover(
    parent_a: list[int],
    parent_b: list[int],
    rate: float
) -> tuple[list[int], list[int]]:
    """
    Crossover de um ponto:
    - Com probabilidade `rate`, seleciona um ponto de corte aleatório.
    - Troca as caudas dos dois pais para gerar dois filhos.
    - Se não ocorrer crossover, filhos são cópias dos pais.
    """
    if random.random() < rate:
        point = random.randint(1, N_ITEMS - 1)
        child_a = parent_a[:point] + parent_b[point:]
        child_b = parent_b[:point] + parent_a[point:]
        return child_a, child_b
    return parent_a[:], parent_b[:]


# ─────────────────────────────────────────────
# MUTAÇÃO — Bit Flip
# ─────────────────────────────────────────────

def mutate(chromosome: list[int], rate: float) -> list[int]:
    """
    Mutação bit-flip:
    - Cada gene tem probabilidade `rate` de ser invertido (0→1 ou 1→0).
    """
    return [
        1 - gene if random.random() < rate else gene
        for gene in chromosome
    ]


# ─────────────────────────────────────────────
# ALGORITMO GENÉTICO PRINCIPAL
# ─────────────────────────────────────────────

def genetic_algorithm(
    pop_size: int    = 50,
    n_generations: int = 100,
    mutation_rate: float = 0.05,
    crossover_rate: float = 0.80,
    elite_n: int     = 2,
) -> dict:
    """
    Executa o algoritmo genético completo.

    Parâmetros
    ----------
    pop_size       : tamanho da população
    n_generations  : número de gerações
    mutation_rate  : taxa de mutação (0.0 a 1.0)
    crossover_rate : taxa de crossover (0.0 a 1.0)
    elite_n        : número de elites preservados por geração

    Retorna
    -------
    dict com histórico de fitness, melhor solução e log detalhado
    """
    start_time = time.time()

    # ── Inicialização ──────────────────────────────
    population = initial_population(pop_size)

    history = []          # fitness melhor + médio por geração
    generation_log = []   # log detalhado

    global_best_chromosome = None
    global_best_fitness     = -1.0

    for gen in range(n_generations):

        # ── Avaliação ──────────────────────────────
        fit_values = evaluate_population(population)

        best_fit_gen = max(fit_values)
        avg_fit_gen  = sum(fit_values) / len(fit_values)
        best_idx_gen = fit_values.index(best_fit_gen)
        best_chrom_gen = population[best_idx_gen]

        # Atualiza melhor global
        if best_fit_gen > global_best_fitness:
            global_best_fitness    = best_fit_gen
            global_best_chromosome = best_chrom_gen[:]

        history.append({
            "generation": gen + 1,
            "best_fitness": round(best_fit_gen, 2),
            "avg_fitness":  round(avg_fit_gen, 2),
        })

        # Log a cada 10 gerações, mais a primeira e a última
        if gen == 0 or (gen + 1) % 10 == 0 or gen == n_generations - 1:
            w = sum(best_chrom_gen[i] * ITEMS[i]["weight"] for i in range(N_ITEMS))
            s = sum(best_chrom_gen[i] * ITEMS[i]["score"]  for i in range(N_ITEMS))
            generation_log.append({
                "generation":   gen + 1,
                "best_fitness": round(best_fit_gen, 2),
                "avg_fitness":  round(avg_fit_gen, 2),
                "weight":       w,
                "score":        s,
                "chromosome":   best_chrom_gen[:],
            })

        # ── Elitismo ───────────────────────────────
        # Ordena população por fitness (decrescente)
        ranked = sorted(
            zip(fit_values, population),
            key=lambda x: x[0],
            reverse=True
        )
        new_population = [chrom[:] for _, chrom in ranked[:elite_n]]

        # ── Reprodução ─────────────────────────────
        while len(new_population) < pop_size:
            parent_a = tournament_select(population, fit_values)
            parent_b = tournament_select(population, fit_values)

            child_a, child_b = crossover(parent_a, parent_b, crossover_rate)

            child_a = mutate(child_a, mutation_rate)
            child_b = mutate(child_b, mutation_rate)

            new_population.append(child_a)
            if len(new_population) < pop_size:
                new_population.append(child_b)

        population = new_population

    elapsed = round(time.time() - start_time, 3)

    # ── Monta resultado final ───────────────────────
    best = global_best_chromosome
    best_weight = sum(best[i] * ITEMS[i]["weight"] for i in range(N_ITEMS))
    best_score  = sum(best[i] * ITEMS[i]["score"]  for i in range(N_ITEMS))
    selected_items = [
        {**ITEMS[i], "index": i}
        for i in range(N_ITEMS) if best[i] == 1
    ]

    return {
        "best_chromosome":  best,
        "best_fitness":     round(global_best_fitness, 2),
        "best_weight":      best_weight,
        "best_score":       best_score,
        "selected_items":   selected_items,
        "valid":            best_weight <= CAPACITY,
        "history":          history,
        "generation_log":   generation_log,
        "elapsed_seconds":  elapsed,
        "params": {
            "pop_size":       pop_size,
            "n_generations":  n_generations,
            "mutation_rate":  mutation_rate,
            "crossover_rate": crossover_rate,
            "elite_n":        elite_n,
        },
    }


# ─────────────────────────────────────────────
# ROTAS DA API
# ─────────────────────────────────────────────

@app.route("/api/items", methods=["GET"])
def get_items():
    """Retorna a lista de itens e a capacidade da mochila."""
    return jsonify({"items": ITEMS, "capacity": CAPACITY})


@app.route("/api/run", methods=["POST"])
def run_algorithm():
    """
    Executa o algoritmo genético com os parâmetros recebidos.

    Body JSON esperado:
    {
        "pop_size":       50,
        "n_generations":  100,
        "mutation_rate":  0.05,
        "crossover_rate": 0.80,
        "elite_n":        2
    }
    """
    data = request.get_json(force=True) or {}

    pop_size       = max(10,  min(200, int(data.get("pop_size",       50))))
    n_generations  = max(10,  min(500, int(data.get("n_generations",  100))))
    mutation_rate  = max(0.0, min(1.0, float(data.get("mutation_rate",  0.05))))
    crossover_rate = max(0.0, min(1.0, float(data.get("crossover_rate", 0.80))))
    elite_n        = max(0,   min(20,  int(data.get("elite_n",         2))))

    result = genetic_algorithm(
        pop_size=pop_size,
        n_generations=n_generations,
        mutation_rate=mutation_rate,
        crossover_rate=crossover_rate,
        elite_n=elite_n,
    )

    return jsonify(result)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("🎒 Knapsack GA — Backend rodando em http://localhost:5000")
    app.run(debug=True, port=5000)