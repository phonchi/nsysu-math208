// dscpp/queue.hpp -- vector-backed Queue template (Chapter 5)
#ifndef DSCPP_QUEUE_HPP
#define DSCPP_QUEUE_HPP
#include <vector>
using namespace std;

template <typename T>
class Queue {
    private:
        vector<T> items;
    public:
        bool isEmpty() { return items.empty(); }
        void enqueue(T item) { items.insert(items.begin(), item); }
        T dequeue() { T front = items.back(); items.pop_back(); return front; }
        int size() { return items.size(); }
};
#endif
