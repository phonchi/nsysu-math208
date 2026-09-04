// pythonds3/cppds/searching.hpp -- the searching algorithms of Chapter 7
#ifndef DSCPP_SEARCHING_HPP
#define DSCPP_SEARCHING_HPP
#include <iostream>
#include <vector>
using namespace std;

bool sequentialSearch(const vector<int>& aList, int item) {
    unsigned pos = 0;
    while (pos < aList.size()) {
        if (aList[pos] == item) return true;
        pos = pos + 1;
    }
    return false;
}

bool orderedSequentialSearch(const vector<int>& aList, int item) {
    unsigned pos = 0;
    while (pos < aList.size()) {
        if (aList[pos] == item) return true;
        if (aList[pos] > item) return false;
        pos = pos + 1;
    }
    return false;
}

// prints how far the midpoint moves at every probe
bool binarySearch(const vector<int>& aList, int item) {
    int first = 0;
    int last = static_cast<int>(aList.size()) - 1;
    while (first <= last) {
        int midpoint = (first + last) / 2;
        cout << midpoint - first << endl;
        if (aList[midpoint] == item) return true;
        else if (item < aList[midpoint]) last = midpoint - 1;
        else first = midpoint + 1;
    }
    return false;
}

// Index bounds keep each recursive step O(1); no sub-vector is copied.
bool binarySearchRecRange(const vector<int>& aList, int item,
                          int first, int last) {
    if (first > last) return false;
    int midpoint = first + (last - first) / 2;
    cout << aList[midpoint] << endl;
    if (aList[midpoint] == item) return true;
    if (item < aList[midpoint]) {
        return binarySearchRecRange(aList, item, first, midpoint - 1);
    }
    return binarySearchRecRange(aList, item, midpoint + 1, last);
}

// Preserve the original two-argument entry point used by the course examples.
bool binarySearchRec(const vector<int>& aList, int item) {
    return binarySearchRecRange(aList, item, 0,
                                static_cast<int>(aList.size()) - 1);
}
#endif
