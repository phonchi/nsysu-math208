// pythonds3/cppds/binaryheap.hpp -- vector-backed min-heap and PriorityQueue (Chapter 9)
#ifndef DSCPP_BINARYHEAP_HPP
#define DSCPP_BINARYHEAP_HPP
#include <iostream>
#include <vector>
#include <algorithm>
#include <stdexcept>
#include <utility>
using namespace std;

template <typename T = int>
class BinaryHeap {
    public:
        vector<T> heap;
        bool isEmpty() const { return heap.empty(); }
        int size() const { return static_cast<int>(heap.size()); }
        void percUp(int i) {
            while ((i - 1) / 2 >= 0 && i > 0) {
                int parentIdx = (i - 1) / 2;
                if (heap[i] < heap[parentIdx]) {
                    swap(heap[i], heap[parentIdx]);
                } else {
                    break;
                }
                i = parentIdx;
            }
        }
        void insert(T item) {
            heap.push_back(item);
            percUp(heap.size() - 1);
        }
        int getMinChild(int i) {
            if (2 * i + 2 > (int)heap.size() - 1) return 2 * i + 1;
            if (heap[2 * i + 1] < heap[2 * i + 2]) return 2 * i + 1;
            return 2 * i + 2;
        }
        void percDown(int i) {
            while (2 * i + 1 < (int)heap.size()) {
                int smChild = getMinChild(i);
                if (heap[i] > heap[smChild]) {
                    swap(heap[i], heap[smChild]);
                } else {
                    break;
                }
                i = smChild;
            }
        }
        T delet() {   // C++ reserves the word delete!
            if (heap.empty()) throw underflow_error("Cannot delete from an empty heap");
            swap(heap[0], heap[heap.size() - 1]);
            T result = heap.back();
            heap.pop_back();
            if (!heap.empty()) percDown(0);
            return result;
        }
        T delMin() { return delet(); }
        T findMin() const {
            if (heap.empty()) throw underflow_error("Cannot inspect an empty heap");
            return heap[0];
        }
        void heapify(vector<T> notAHeap) {
            heap = notAHeap;
            int i = heap.size() / 2 - 1;
            while (i >= 0) {
                percDown(i);
                i = i - 1;
            }
        }
        void buildHeap(vector<T> notAHeap) { heapify(notAHeap); }
        void print() {
            for (T x : heap) cout << x << " ";
            cout << endl;
        }
};

// Min-priority queue: each entry is a (priority, item) pair, smallest priority first.
template <typename K>
class PriorityQueue : public BinaryHeap<pair<int, K>> {
    public:
        void insert(int priority, K item) {
            BinaryHeap<pair<int, K>>::insert(make_pair(priority, item));
        }
        void changePriority(K item, int newPriority) {
            for (int i = 0; i < (int)this->heap.size(); i++) {
                if (this->heap[i].second == item) {
                    this->heap[i].first = newPriority;
                    this->percUp(i);
                    this->percDown(i);
                    return;
                }
            }
        }
        bool contains(K item) const {
            for (const pair<int, K>& entry : this->heap) {
                if (entry.second == item) return true;
            }
            return false;
        }
};
#endif
