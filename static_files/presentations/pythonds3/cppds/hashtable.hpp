// pythonds3/cppds/hashtable.hpp -- open-addressing hash table (Chapter 7)
#ifndef DSCPP_HASHTABLE_HPP
#define DSCPP_HASHTABLE_HPP
#include <iostream>
#include <vector>
#include <string>
#include <stdexcept>
using namespace std;

class HashTable {
    public:
        HashTable(int sz) {
            if (sz <= 0) throw invalid_argument("hash table size must be positive");
            size = sz;
            slots = vector<int>(size, -1);       // -1 marks an empty slot
            data = vector<string>(size, "");
        }
        int hashFunction(int key) { return (key % size + size) % size; }
        int rehash(int oldHash) { return (oldHash + 1) % size; }
        void put(int key, string value) {
            if (key == -1) {
                throw invalid_argument("key -1 is reserved as the empty-slot marker");
            }
            int hashValue = hashFunction(key);
            int position = hashValue;
            do {
                if (slots[position] == -1) {
                    slots[position] = key;
                    data[position] = value;
                    return;
                }
                if (slots[position] == key) {
                    data[position] = value;
                    return;
                }
                position = rehash(position);
            } while (position != hashValue);
            throw overflow_error("hash table is full");
        }
        string get(int key) {
            int startSlot = hashFunction(key);
            int position = startSlot;
            while (slots[position] != -1) {
                if (slots[position] == key) return data[position];
                position = rehash(position);
                if (position == startSlot) return "";
            }
            return "";
        }
        void printSlots() {
            for (int s : slots) cout << s << " ";
            cout << endl;
        }
        void printData() {
            for (string& d : data) cout << (d == "" ? "-" : d) << " ";
            cout << endl;
        }
    private:
        int size;
        vector<int> slots;
        vector<string> data;
};
#endif
