// dscpp/binaryheap.hpp -- vector-backed min-heap (Chapter 9)
#ifndef DSCPP_BINARYHEAP_HPP
#define DSCPP_BINARYHEAP_HPP
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class BinaryHeap {
    public:
        vector<int> heap;
        bool isEmpty() { return heap.empty(); }
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
        void insert(int item) {
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
        int delet() {   // C++ reserves the word delete!
            swap(heap[0], heap[heap.size() - 1]);
            int result = heap.back();
            heap.pop_back();
            percDown(0);
            return result;
        }
        void heapify(vector<int> notAHeap) {
            heap = notAHeap;
            int i = heap.size() / 2 - 1;
            while (i >= 0) {
                percDown(i);
                i = i - 1;
            }
        }
        void print() {
            for (int x : heap) cout << x << " ";
            cout << endl;
        }
};
#endif
