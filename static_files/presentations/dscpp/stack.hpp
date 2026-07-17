// dscpp/stack.hpp -- vector-backed Stack templates (Chapter 5)
#ifndef DSCPP_STACK_HPP
#define DSCPP_STACK_HPP
#include <iostream>
#include <vector>
using namespace std;

template <typename T>
class Stack {
    private:
        vector<T> items;
    public:
        bool isEmpty() { return items.empty(); }
        void push(T item) { items.push_back(item); }
        T pop() { T top = items.back(); items.pop_back(); return top; }
        T peek() { return items.back(); }
        int size() { return items.size(); }
        void display() { for (T x : items) cout << x << " "; cout << endl; }
};

// Variant with the top at the FRONT of the vector: every operation is O(n)!
template <typename T>
class Stack2 {
    private:
        vector<T> items;
    public:
        bool isEmpty() { return items.empty(); }
        void push(T item) { items.insert(items.begin(), item); }
        T pop() { T top = items.front(); items.erase(items.begin()); return top; }
        T peek() { return items.front(); }
        int size() { return items.size(); }
};
#endif
