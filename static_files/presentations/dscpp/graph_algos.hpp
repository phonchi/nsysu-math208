// dscpp/graph_algos.hpp -- the graph algorithms of Chapter 8
#ifndef DSCPP_GRAPH_ALGOS_HPP
#define DSCPP_GRAPH_ALGOS_HPP
#include "dscpp/graph.hpp"
#include <queue>
#include <set>
#include <vector>
#include <algorithm>
#include <climits>
#include <cstdio>

// ---- word ladder ----
Graph buildGraph(vector<string> words) {
    map<string, set<string>> buckets;
    Graph theGraph;
    for (string word : words) {
        for (unsigned i = 0; i < word.length(); i++) {
            string bucket = word.substr(0, i) + "_" + word.substr(i + 1);
            buckets[bucket].insert(word);
        }
    }
    for (auto& pair : buckets) {
        for (const string& word1 : pair.second) {
            for (const string& word2 : pair.second) {
                if (word1 != word2) theGraph.addEdge(word1, word2);
            }
        }
    }
    return theGraph;
}

void bfs(Graph& g, string startKey) {
    g.vertices[startKey].distance = 0;
    queue<string> vertQueue;
    vertQueue.push(startKey);
    while (!vertQueue.empty()) {
        string currentKey = vertQueue.front();
        vertQueue.pop();
        Vertex& current = g.vertices[currentKey];
        for (auto& n : current.neighbors) {
            Vertex& neighbor = g.vertices[n.first];
            if (neighbor.color == "white") {
                neighbor.color = "gray";
                neighbor.distance = current.distance + 1;
                neighbor.previous = currentKey;
                vertQueue.push(n.first);
            }
        }
        current.color = "black";
    }
}

void traverse(Graph& g, string startingKey) {
    string current = startingKey;
    while (current != "") {
        cout << current;
        if (g.vertices[current].previous != "") cout << "->";
        current = g.vertices[current].previous;
    }
    cout << endl;
}

// ---- knight's tour ----
vector<pair<int, int>> genLegalMoves(int row, int col, int boardSize) {
    vector<pair<int, int>> newMoves;
    vector<pair<int, int>> moveOffsets = {
        {-1, -2}, {-1, 2}, {-2, -1}, {-2, 1},
        {1, -2},  {1, 2},  {2, -1},  {2, 1}};
    for (auto& off : moveOffsets) {
        int newRow = row + off.first;
        int newCol = col + off.second;
        if (0 <= newRow && newRow < boardSize && 0 <= newCol && newCol < boardSize) {
            newMoves.push_back({newRow, newCol});
        }
    }
    return newMoves;
}

Graph knightGraph(int boardSize) {
    Graph ktGraph;
    for (int row = 0; row < boardSize; row++) {
        for (int col = 0; col < boardSize; col++) {
            int nodeId = row * boardSize + col;
            for (auto& move : genLegalMoves(row, col, boardSize)) {
                int otherNodeId = move.first * boardSize + move.second;
                ktGraph.addEdge(to_string(nodeId), to_string(otherNodeId));
            }
        }
    }
    return ktGraph;
}

void printBoard(vector<string>& path, int boardSize) {
    vector<vector<int>> board(boardSize, vector<int>(boardSize, -1));
    for (unsigned i = 0; i < path.size(); i++) {
        int id = stoi(path[i]);
        board[id / boardSize][id % boardSize] = i;
    }
    for (auto& row : board) {
        for (int v : row) printf("%4d", v);
        printf("\n");
    }
}

bool knightTour(int n, vector<string>& path, string uKey, int limit, Graph& g) {
    g.vertices[uKey].color = "gray";
    path.push_back(uKey);
    if (n < limit) {
        bool done = false;
        for (auto& nb : g.vertices[uKey].neighbors) {
            if (done) break;
            if (g.vertices[nb.first].color == "white") {
                done = knightTour(n + 1, path, nb.first, limit, g);
            }
        }
        if (!done) {
            path.pop_back();
            g.vertices[uKey].color = "white";
        }
        return done;
    }
    return true;
}

vector<string> orderByAvail(Graph& g, string uKey) {
    vector<pair<int, string>> resList;
    for (auto& nb : g.vertices[uKey].neighbors) {
        if (g.vertices[nb.first].color == "white") {
            int c = 0;
            for (auto& w : g.vertices[nb.first].neighbors) {
                if (g.vertices[w.first].color == "white") c++;
            }
            resList.push_back({c, nb.first});
        }
    }
    sort(resList.begin(), resList.end());
    vector<string> result;
    for (auto& p : resList) result.push_back(p.second);
    return result;
}

bool knightTourWarnsdorff(int n, vector<string>& path, string uKey, int limit, Graph& g) {
    g.vertices[uKey].color = "gray";
    path.push_back(uKey);
    if (n < limit) {
        bool done = false;
        for (string nbKey : orderByAvail(g, uKey)) {
            if (done) break;
            if (g.vertices[nbKey].color == "white") {
                done = knightTourWarnsdorff(n + 1, path, nbKey, limit, g);
            }
        }
        if (!done) {
            path.pop_back();
            g.vertices[uKey].color = "white";
        }
        return done;
    }
    return true;
}

// ---- DFS ----
class DFSGraph : public Graph {
    public:
        int time = 0;
        map<string, int> discovery;
        map<string, int> closing;
        void dfs() {
            for (auto& p : vertices) {
                p.second.color = "white";
                p.second.previous = "";
            }
            for (auto& p : vertices) {
                if (p.second.color == "white") dfsVisit(p.first);
            }
        }
        void dfsVisit(string startKey) {
            vertices[startKey].color = "gray";
            time = time + 1;
            discovery[startKey] = time;
            for (auto& n : vertices[startKey].neighbors) {
                if (vertices[n.first].color == "white") {
                    vertices[n.first].previous = startKey;
                    dfsVisit(n.first);
                }
            }
            vertices[startKey].color = "black";
            time = time + 1;
            closing[startKey] = time;
        }
};

// ---- Dijkstra / Prim ----
void dijkstra(Graph& g, string startKey) {
    priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;
    for (auto& p : g.vertices) p.second.distance = INT_MAX;
    g.vertices[startKey].distance = 0;
    pq.push({0, startKey});
    while (!pq.empty()) {
        pair<int, string> top = pq.top();
        pq.pop();
        int distance = top.first;
        string currentKey = top.second;
        if (distance > g.vertices[currentKey].distance) continue;
        for (auto& n : g.vertices[currentKey].neighbors) {
            int newDistance = g.vertices[currentKey].distance + n.second;
            if (newDistance < g.vertices[n.first].distance) {
                g.vertices[n.first].distance = newDistance;
                g.vertices[n.first].previous = currentKey;
                pq.push({newDistance, n.first});
            }
        }
    }
}

vector<string> findPath(Graph& g, string startKey, string endKey) {
    vector<string> path;
    string current = endKey;
    while (current != "" && current != startKey) {
        path.push_back(current);
        current = g.vertices[current].previous;
    }
    if (current == "") return {};
    path.push_back(startKey);
    reverse(path.begin(), path.end());
    return path;
}

void prim(Graph& g, string startKey) {
    priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;
    set<string> inTree;
    for (auto& p : g.vertices) {
        p.second.distance = INT_MAX;
        p.second.previous = "";
    }
    g.vertices[startKey].distance = 0;
    pq.push({0, startKey});
    while (!pq.empty()) {
        pair<int, string> top = pq.top();
        pq.pop();
        string currentKey = top.second;
        if (inTree.count(currentKey)) continue;
        inTree.insert(currentKey);
        for (auto& n : g.vertices[currentKey].neighbors) {
            int newDistance = n.second;
            if (inTree.count(n.first) == 0 && newDistance < g.vertices[n.first].distance) {
                g.vertices[n.first].distance = newDistance;
                g.vertices[n.first].previous = currentKey;
                pq.push({newDistance, n.first});
            }
        }
    }
}
#endif
