// dscpp/searching.hpp -- the searching algorithms of Chapter 7
#ifndef DSCPP_SEARCHING_HPP
#define DSCPP_SEARCHING_HPP
#include <iostream>
#include <vector>
using namespace std;

bool sequentialSearch(vector<int> aList, int item) {
    unsigned pos = 0;
    while (pos < aList.size()) {
        if (aList[pos] == item) return true;
        pos = pos + 1;
    }
    return false;
}

bool orderedSequentialSearch(vector<int> aList, int item) {
    unsigned pos = 0;
    while (pos < aList.size()) {
        if (aList[pos] == item) return true;
        if (aList[pos] > item) return false;
        pos = pos + 1;
    }
    return false;
}

// prints how far the midpoint moves at every probe
bool binarySearch(vector<int> aList, int item) {
    int first = 0;
    int last = aList.size() - 1;
    while (first <= last) {
        int midpoint = (first + last) / 2;
        cout << midpoint - first << endl;
        if (aList[midpoint] == item) return true;
        else if (item < aList[midpoint]) last = midpoint - 1;
        else first = midpoint + 1;
    }
    return false;
}

// prints the probed value at every level of recursion
bool binarySearchRec(vector<int> aList, int item) {
    if (aList.size() == 0) return false;
    int midpoint = (aList.size() - 1) / 2;
    cout << aList[midpoint] << endl;
    if (aList[midpoint] == item) return true;
    if (item < aList[midpoint]) {
        vector<int> left(aList.begin(), aList.begin() + midpoint);
        return binarySearchRec(left, item);
    }
    vector<int> right(aList.begin() + midpoint + 1, aList.end());
    return binarySearchRec(right, item);
}
#endif
