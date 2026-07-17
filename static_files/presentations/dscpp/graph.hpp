// dscpp/graph.hpp -- adjacency-map Graph (Chapter 8)
#ifndef DSCPP_GRAPH_HPP
#define DSCPP_GRAPH_HPP
#include <iostream>
#include <map>
#include <string>
using namespace std;

class Vertex {
    public:
        string key;
        map<string, int> neighbors;   // key -> weight
        string color = "white";
        int distance = 0;
        string previous = "";
        Vertex() {}
        Vertex(string k) { key = k; }
};

class Graph {
    public:
        map<string, Vertex> vertices;
        void setVertex(string key) { vertices[key] = Vertex(key); }
        void addEdge(string fromVert, string toVert, int weight = 0) {
            if (vertices.count(fromVert) == 0) setVertex(fromVert);
            if (vertices.count(toVert) == 0) setVertex(toVert);
            vertices[fromVert].neighbors[toVert] = weight;
        }
};
#endif
