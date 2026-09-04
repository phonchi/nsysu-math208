// pythonds3/cppds/graph.hpp -- adjacency-map Graph (Chapter 8)
#ifndef DSCPP_GRAPH_HPP
#define DSCPP_GRAPH_HPP
#include <iostream>
#include <limits>
#include <map>
#include <string>
using namespace std;

class Vertex {
    public:
        string key;
        map<string, int> neighbors;   // key -> weight
        string color = "white";
        // INT_MAX means that this vertex has not been reached from the source.
        int distance = numeric_limits<int>::max();
        string previous = "";
        Vertex() {}
        Vertex(string k) { key = k; }
};

class Graph {
    public:
        map<string, Vertex> vertices;
        // Preserve an existing vertex and all of its edges/traversal state.
        void setVertex(string key) {
            if (vertices.count(key) == 0) vertices.emplace(key, Vertex(key));
        }
        void addEdge(string fromVert, string toVert, int weight = 0) {
            if (vertices.count(fromVert) == 0) setVertex(fromVert);
            if (vertices.count(toVert) == 0) setVertex(toVert);
            vertices[fromVert].neighbors[toVert] = weight;
        }
};
#endif
