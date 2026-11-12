// pythonds3/cppds/sorting.hpp -- the six sorting algorithms of Chapter 7
//
// The sorts print their intermediate steps so the lecture can show each pass.
// Set sortingTrace = false (e.g. at the start of main) to silence them, which
// is what you want for benchmarks such as HW4. printl() itself always prints.
// All functions are inline, so several .cpp files may include this header.
#ifndef DSCPP_SORTING_HPP
#define DSCPP_SORTING_HPP
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

inline bool sortingTrace = true;   // false: the sorts below print nothing

inline void printl(vector<int>& aList) {
    for (int x : aList) cout << x << " ";
    cout << endl;
}

inline void bubbleSort(vector<int>& aList) {
    for (int i = aList.size() - 1; i > 0; i--) {
        if (sortingTrace) printl(aList);
        for (int j = 0; j < i; j++) {
            if (aList[j] > aList[j + 1]) {
                int temp = aList[j];
                aList[j] = aList[j + 1];
                aList[j + 1] = temp;
            }
        }
    }
}

inline void bubbleSortShort(vector<int>& aList) {
    for (int i = aList.size() - 1; i > 0; i--) {
        bool exchanges = false;
        for (int j = 0; j < i; j++) {
            if (aList[j] > aList[j + 1]) {
                exchanges = true;
                swap(aList[j], aList[j + 1]);
            }
        }
        if (!exchanges) break;
    }
}

inline void selectionSort(vector<int>& aList) {
    int n = static_cast<int>(aList.size());
    for (int fillSlot = n - 1; fillSlot > 0; fillSlot--) {
        if (sortingTrace) printl(aList);
        int positionOfMax = 0;
        for (int location = 1; location <= fillSlot; location++) {
            if (aList[location] > aList[positionOfMax]) {
                positionOfMax = location;
            }
        }
        if (positionOfMax != fillSlot) {
            swap(aList[positionOfMax], aList[fillSlot]);
        }
    }
}

inline void insertionSort(vector<int>& aList) {
    for (unsigned i = 1; i < aList.size(); i++) {
        if (sortingTrace) printl(aList);
        int curVal = aList[i];
        int curPos = i;
        while (curPos > 0 && aList[curPos - 1] > curVal) {
            aList[curPos] = aList[curPos - 1];
            curPos = curPos - 1;
        }
        aList[curPos] = curVal;
    }
}

inline void gapInsertionSort(vector<int>& aList, int start, int gap) {
    for (unsigned i = start + gap; i < aList.size(); i += gap) {
        int curVal = aList[i];
        int curPos = i;
        while (curPos >= gap && aList[curPos - gap] > curVal) {
            aList[curPos] = aList[curPos - gap];
            curPos = curPos - gap;
        }
        aList[curPos] = curVal;
    }
}

inline void shellSort(vector<int>& aList) {
    int sublistCount = aList.size() / 2;
    while (sublistCount > 0) {
        for (int posStart = 0; posStart < sublistCount; posStart++) {
            gapInsertionSort(aList, posStart, sublistCount);
        }
        if (sortingTrace) {
            cout << "After increments of size " << sublistCount << " the list is ";
            printl(aList);
        }
        sublistCount = sublistCount / 2;
    }
}

inline void mergeSort(vector<int>& aList) {
    if (sortingTrace) { cout << "Splitting "; printl(aList); }
    if (aList.size() > 1) {
        int mid = aList.size() / 2;
        vector<int> leftHalf(aList.begin(), aList.begin() + mid);
        vector<int> rightHalf(aList.begin() + mid, aList.end());
        mergeSort(leftHalf);
        mergeSort(rightHalf);
        unsigned i = 0, j = 0, k = 0;
        while (i < leftHalf.size() && j < rightHalf.size()) {
            if (leftHalf[i] <= rightHalf[j]) { aList[k] = leftHalf[i]; i++; }
            else { aList[k] = rightHalf[j]; j++; }
            k++;
        }
        while (i < leftHalf.size()) { aList[k] = leftHalf[i]; i++; k++; }
        while (j < rightHalf.size()) { aList[k] = rightHalf[j]; j++; k++; }
    }
    if (sortingTrace) { cout << "Merging "; printl(aList); }
}

inline int partition(vector<int>& aList, int first, int last) {
    int pivotVal = aList[first];
    int leftMark = first + 1;
    int rightMark = last;
    bool done = false;
    while (!done) {
        while (leftMark <= rightMark && aList[leftMark] <= pivotVal) leftMark++;
        while (leftMark <= rightMark && aList[rightMark] >= pivotVal) rightMark--;
        if (rightMark < leftMark) done = true;
        else swap(aList[leftMark], aList[rightMark]);
    }
    swap(aList[first], aList[rightMark]);
    return rightMark;
}

inline void quickSortHelper(vector<int>& aList, int first, int last) {
    if (first < last) {
        int split = partition(aList, first, last);
        if (sortingTrace) printl(aList);
        quickSortHelper(aList, first, split - 1);
        quickSortHelper(aList, split + 1, last);
    }
}

inline void quickSort(vector<int>& aList) {
    quickSortHelper(aList, 0, aList.size() - 1);
}

inline int partitionDesc(vector<int>& aList, int first, int last, bool descending) {
    int pivotVal = aList[first];
    int leftMark = first + 1;
    int rightMark = last;
    bool done = false;
    while (!done) {
        if (descending) {
            while (leftMark <= rightMark && aList[leftMark] >= pivotVal) leftMark++;
            while (leftMark <= rightMark && aList[rightMark] <= pivotVal) rightMark--;
        } else {
            while (leftMark <= rightMark && aList[leftMark] <= pivotVal) leftMark++;
            while (leftMark <= rightMark && aList[rightMark] >= pivotVal) rightMark--;
        }
        if (rightMark < leftMark) done = true;
        else swap(aList[leftMark], aList[rightMark]);
    }
    swap(aList[first], aList[rightMark]);
    return rightMark;
}

inline void quickSortHelperDesc(vector<int>& aList, int first, int last, bool descending) {
    if (first < last) {
        int split = partitionDesc(aList, first, last, descending);
        quickSortHelperDesc(aList, first, split - 1, descending);
        quickSortHelperDesc(aList, split + 1, last, descending);
    }
}

inline void quickSortDesc(vector<int>& aList, bool descending = false) {
    quickSortHelperDesc(aList, 0, aList.size() - 1, descending);
}
#endif
