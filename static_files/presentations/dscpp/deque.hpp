// dscpp/deque.hpp -- vector-backed Deque template (Chapter 5)
#ifndef DSCPP_DEQUE_HPP
#define DSCPP_DEQUE_HPP
#include <vector>
using namespace std;

template <typename T>
class Deque {
    private:
        vector<T> items;
    public:
        bool isEmpty() { return items.empty(); }
        void addFront(T item) { items.push_back(item); }
        void addRear(T item) { items.insert(items.begin(), item); }
        T removeFront() { T front = items.back(); items.pop_back(); return front; }
        T removeRear() { T rear = items.front(); items.erase(items.begin()); return rear; }
        int size() { return items.size(); }
};
#endif
