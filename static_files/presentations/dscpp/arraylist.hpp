// dscpp/arraylist.hpp -- dynamic array built on a raw C++ array (Chapter 3)
#ifndef DSCPP_ARRAYLIST_HPP
#define DSCPP_ARRAYLIST_HPP
#include <iostream>
#include <stdexcept>
using namespace std;

class ArrayList {
    public:
        ArrayList(int initialCapacity = 8) {
            maxSize = initialCapacity;
            lastIndex = 0;
            myArray = new int[maxSize];
        }
        ~ArrayList() { delete[] myArray; }
        void append(int val) {
            if (lastIndex == maxSize) grow();
            myArray[lastIndex] = val;
            lastIndex++;
        }
        int size() { return lastIndex; }
        bool isEmpty() { return lastIndex == 0; }
        int& operator[](int idx) {
            if (0 <= idx && idx < lastIndex) return myArray[idx];
            throw out_of_range("index out of bounds");
        }
        void insert(int idx, int val) {
            if (lastIndex == maxSize) grow();
            for (int i = lastIndex; i > idx; i--) myArray[i] = myArray[i - 1];
            myArray[idx] = val;
            lastIndex++;
        }
        void remove(int val) {
            for (int i = 0; i < lastIndex; i++) {
                if (myArray[i] == val) {
                    for (int j = i; j < lastIndex - 1; j++) myArray[j] = myArray[j + 1];
                    lastIndex--;
                    return;
                }
            }
            throw invalid_argument("value not found");
        }
        void erase(int idx) {
            for (int j = idx; j < lastIndex - 1; j++) myArray[j] = myArray[j + 1];
            lastIndex--;
        }
        void display() {
            for (int i = 0; i < lastIndex; i++) cout << myArray[i] << " ";
            cout << endl;
        }
    private:
        void grow() {
            maxSize = maxSize * 2;
            int* bigger = new int[maxSize];
            for (int i = 0; i < lastIndex; i++) bigger[i] = myArray[i];
            delete[] myArray;
            myArray = bigger;
        }
        int maxSize;
        int lastIndex;
        int* myArray;
};
#endif
