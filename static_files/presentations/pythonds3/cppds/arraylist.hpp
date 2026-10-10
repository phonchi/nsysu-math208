// Chapter 3: an int-only, vector-like dynamic array.
// insert/erase take indices, not iterators; both [] and at() check bounds.
// Growth doubles capacity. Erasing elements does not shrink capacity.
#ifndef DSCPP_ARRAYLIST_HPP
#define DSCPP_ARRAYLIST_HPP
#include <limits>
#include <stdexcept>
using namespace std;

class ArrayList {
private:
    int* myArray;
    int lastIndex;  // Number of elements; also the next free position.
    int maxSize;

    void checkIndex(int idx) const {
        if (idx < 0 || idx >= lastIndex)
            throw out_of_range("index out of bounds");
    }

    void grow() {
        if (maxSize > numeric_limits<int>::max() / 2)
            throw length_error("capacity too large");
        int newCapacity = (maxSize == 0) ? 1 : maxSize * 2;
        int* bigger = new int[newCapacity];
        for (int i = 0; i < lastIndex; ++i)
            bigger[i] = myArray[i];
        delete[] myArray;
        myArray = bigger;
        maxSize = newCapacity;
    }

public:
    explicit ArrayList(int initialCapacity = 8) {
        if (initialCapacity < 0)
            throw invalid_argument("capacity must be nonnegative");
        maxSize = initialCapacity;
        lastIndex = 0;
        myArray = new int[maxSize];
    }

    ~ArrayList() { delete[] myArray; }

    // Each object owns its own array (deep copy).
    ArrayList(const ArrayList& other) {
        maxSize = other.maxSize;
        lastIndex = other.lastIndex;
        myArray = new int[maxSize];
        for (int i = 0; i < lastIndex; ++i)
            myArray[i] = other.myArray[i];
    }

    ArrayList& operator=(const ArrayList& other) {
        if (this == &other) return *this;
        int* copied = new int[other.maxSize];
        for (int i = 0; i < other.lastIndex; ++i)
            copied[i] = other.myArray[i];
        delete[] myArray;
        myArray = copied;
        lastIndex = other.lastIndex;
        maxSize = other.maxSize;
        return *this;
    }

    int size() const { return lastIndex; }
    int capacity() const { return maxSize; }
    bool empty() const { return lastIndex == 0; }

    int& at(int idx) {
        checkIndex(idx);
        return myArray[idx];
    }

    const int& at(int idx) const {
        checkIndex(idx);
        return myArray[idx];
    }

    int& operator[](int idx) { return at(idx); }
    const int& operator[](int idx) const { return at(idx); }

    // Amortized O(1); an individual growth takes O(n).
    void push_back(int val) {
        if (lastIndex == maxSize) grow();
        myArray[lastIndex++] = val;
    }

    void pop_back() {
        if (empty()) throw out_of_range("pop_back on empty ArrayList");
        --lastIndex;
    }

    // Valid insertion positions: 0 through size(), inclusive. O(n).
    void insert(int idx, int val) {
        if (idx < 0 || idx > lastIndex)
            throw out_of_range("insert index out of bounds");
        if (lastIndex == maxSize) grow();
        for (int i = lastIndex; i > idx; --i)
            myArray[i] = myArray[i - 1];
        myArray[idx] = val;
        ++lastIndex;
    }

    // Valid element indices: 0 through size() - 1. O(n).
    void erase(int idx) {
        checkIndex(idx);
        for (int i = idx; i < lastIndex - 1; ++i)
            myArray[i] = myArray[i + 1];
        --lastIndex;
    }

    void clear() { lastIndex = 0; }
};

#endif
