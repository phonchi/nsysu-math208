// dscpp/sorting.hpp -- the six sorting algorithms of Chapter 7
#ifndef DSCPP_SORTING_HPP
#define DSCPP_SORTING_HPP
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void printl(vector<int>& aList) {
    for (int x : aList) cout << x << " ";
    cout << endl;
}

void bubbleSort(vector<int>& aList) {
    for (int i = aList.size() - 1; i > 0; i--) {
        printl(aList);
        for (int j = 0; j < i; j++) {
            if (aList[j] > aList[j + 1]) {
                int temp = aList[j];
                aList[j] = aList[j + 1];
                aList[j + 1] = temp;
            }
        }
    }
}

void bubbleSortShort(vector<int>& aList) {
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

void selectionSort(vector<int>& aList) {
    int n = aList.size();
    for (int i = 0; i < n - 1; i++) {
        printl(aList);
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (aList[j] < aList[minIdx]) minIdx = j;
        }
        if (minIdx != i) swap(aList[i], aList[minIdx]);
    }
}

void insertionSort(vector<int>& aList) {
    for (unsigned i = 1; i < aList.size(); i++) {
        printl(aList);
        int curVal = aList[i];
        int curPos = i;
        while (curPos > 0 && aList[curPos - 1] > curVal) {
            aList[curPos] = aList[curPos - 1];
            curPos = curPos - 1;
        }
        aList[curPos] = curVal;
    }
}

void gapInsertionSort(vector<int>& aList, int start, int gap) {
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

void shellSort(vector<int>& aList) {
    int sublistCount = aList.size() / 2;
    while (sublistCount > 0) {
        for (int posStart = 0; posStart < sublistCount; posStart++) {
            gapInsertionSort(aList, posStart, sublistCount);
        }
        cout << "After increments of size " << sublistCount << " the list is ";
        printl(aList);
        sublistCount = sublistCount / 2;
    }
}

void mergeSort(vector<int>& aList) {
    cout << "Splitting ";
    printl(aList);
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
    cout << "Merging ";
    printl(aList);
}

int partition(vector<int>& aList, int first, int last) {
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

void quickSortHelper(vector<int>& aList, int first, int last) {
    if (first < last) {
        int split = partition(aList, first, last);
        printl(aList);
        quickSortHelper(aList, first, split - 1);
        quickSortHelper(aList, split + 1, last);
    }
}

void quickSort(vector<int>& aList) {
    quickSortHelper(aList, 0, aList.size() - 1);
}

int partitionDesc(vector<int>& aList, int first, int last, bool descending) {
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

void quickSortHelperDesc(vector<int>& aList, int first, int last, bool descending) {
    if (first < last) {
        int split = partitionDesc(aList, first, last, descending);
        quickSortHelperDesc(aList, first, split - 1, descending);
        quickSortHelperDesc(aList, split + 1, last, descending);
    }
}

void quickSortDesc(vector<int>& aList, bool descending = false) {
    quickSortHelperDesc(aList, 0, aList.size() - 1, descending);
}
#endif
