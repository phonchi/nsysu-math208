// dscpp/hashtable.hpp -- open-addressing hash table (Chapter 7)
#ifndef DSCPP_HASHTABLE_HPP
#define DSCPP_HASHTABLE_HPP
#include <iostream>
#include <vector>
#include <string>
using namespace std;

class HashTable {
    public:
        HashTable(int sz) {
            size = sz;
            slots = vector<int>(size, -1);       // -1 marks an empty slot
            data = vector<string>(size, "");
        }
        int hashFunction(int key) { return key % size; }
        int rehash(int oldHash) { return (oldHash + 1) % size; }
        void put(int key, string value) {
            int hashValue = hashFunction(key);
            if (slots[hashValue] == -1) {
                slots[hashValue] = key;
                data[hashValue] = value;
            } else if (slots[hashValue] == key) {
                data[hashValue] = value;
            } else {
                int nextSlot = rehash(hashValue);
                while (slots[nextSlot] != -1 && slots[nextSlot] != key) {
                    nextSlot = rehash(nextSlot);
                }
                slots[nextSlot] = key;
                data[nextSlot] = value;
            }
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
