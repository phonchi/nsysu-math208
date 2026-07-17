// dscpp/anagram.hpp -- the anagram-detection solutions of Chapter 2
#ifndef DSCPP_ANAGRAM_HPP
#define DSCPP_ANAGRAM_HPP
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

bool anagramSolution1(string s1, string s2) {
    bool stillOK = true;
    if (s1.length() != s2.length()) stillOK = false;   // Step 1
    vector<char> aList(s2.begin(), s2.end());
    unsigned pos1 = 0;
    while (pos1 < s1.length() && stillOK) {            // Step 2
        unsigned pos2 = 0;
        bool found = false;
        while (pos2 < aList.size() && !found) {
            if (s1[pos1] == aList[pos2]) found = true;
            else pos2 = pos2 + 1;
        }
        if (found) aList.erase(aList.begin() + pos2);
        else stillOK = false;
        pos1 = pos1 + 1;
    }
    return stillOK;
}

bool anagramSolution2(string s1, string s2) {
    sort(s1.begin(), s1.end());
    sort(s2.begin(), s2.end());
    unsigned pos = 0;
    bool matches = true;
    while (pos < s1.length() && matches) {
        if (s1[pos] == s2[pos]) pos = pos + 1;
        else matches = false;
    }
    return matches;
}

bool anagramSolution4(string s1, string s2) {
    int c1[26] = {0};
    int c2[26] = {0};
    for (unsigned i = 0; i < s1.length(); i++) c1[s1[i] - 'a']++;
    for (unsigned i = 0; i < s2.length(); i++) c2[s2[i] - 'a']++;
    for (int i = 0; i < 26; i++) {
        if (c1[i] != c2[i]) return false;
    }
    return true;
}
#endif
