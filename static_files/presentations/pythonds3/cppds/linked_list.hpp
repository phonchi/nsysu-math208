// pythonds3/cppds/linked_list.hpp -- Node / UnorderedList / OrderedList (Chapter 4)
#ifndef DSCPP_LINKED_LIST_HPP
#define DSCPP_LINKED_LIST_HPP
#include <iostream>
#include <utility>
using namespace std;

template <typename T>
class Node {
    private:
        T data;
        Node<T> *next;
    public:
        Node(T initdata) { data = initdata; next = NULL; }
        T getData() const { return data; }
        Node<T> *getNext() const { return next; }
        void setData(T newData) { data = newData; }
        void setNext(Node<T> *newnext) { next = newnext; }
};

template <typename T>
class UnorderedList {
    private:
        Node<T> *head;
        static Node<T> *cloneChain(const Node<T> *source) {
            if (source == NULL) return NULL;
            Node<T> *copyHead = new Node<T>(source->getData());
            Node<T> *copyTail = copyHead;
            source = source->getNext();
            try {
                while (source != NULL) {
                    copyTail->setNext(new Node<T>(source->getData()));
                    copyTail = copyTail->getNext();
                    source = source->getNext();
                }
            } catch (...) {
                while (copyHead != NULL) {
                    Node<T> *next = copyHead->getNext();
                    delete copyHead;
                    copyHead = next;
                }
                throw;
            }
            return copyHead;
        }
        void clear() {
            while (head != NULL) {
                Node<T> *next = head->getNext();
                delete head;
                head = next;
            }
        }
    public:
        UnorderedList() { head = NULL; }
        ~UnorderedList() { clear(); }
        UnorderedList(const UnorderedList& other) : head(cloneChain(other.head)) {}
        UnorderedList(UnorderedList&& other) noexcept : head(other.head) {
            other.head = NULL;
        }
        UnorderedList& operator=(UnorderedList other) {
            swap(head, other.head);
            return *this;
        }
        Node<T>* getHead() const { return head; }
        bool isEmpty() const { return head == NULL; }
        void add(T item) {
            Node<T> *temp = new Node<T>(item);
            temp->setNext(head);
            head = temp;
        }
        int size() const {
            Node<T> *current = head;
            int count = 0;
            while (current != NULL) { count++; current = current->getNext(); }
            return count;
        }
        bool search(T item) const {
            Node<T> *current = head;
            while (current != NULL) {
                if (current->getData() == item) return true;
                current = current->getNext();
            }
            return false;
        }
        void remove(T item) {
            Node<T> *current = head;
            Node<T> *previous = NULL;
            bool found = false;
            while (!found && current != NULL) {
                if (current->getData() == item) {
                    found = true;
                } else {
                    previous = current;
                    current = current->getNext();
                }
            }
            if (found) {
                if (previous == NULL) head = current->getNext();
                else previous->setNext(current->getNext());
                delete current;
            }
        }
        friend ostream& operator<<(ostream& os, const UnorderedList<T>& ol) {
            Node<T> *current = ol.head;
            while (current != NULL) {
                os << current->getData() << " ";
                current = current->getNext();
            }
            return os;
        }
};

template <typename T>
class OrderedList {
    private:
        Node<T> *head;
        static Node<T> *cloneChain(const Node<T> *source) {
            if (source == NULL) return NULL;
            Node<T> *copyHead = new Node<T>(source->getData());
            Node<T> *copyTail = copyHead;
            source = source->getNext();
            try {
                while (source != NULL) {
                    copyTail->setNext(new Node<T>(source->getData()));
                    copyTail = copyTail->getNext();
                    source = source->getNext();
                }
            } catch (...) {
                while (copyHead != NULL) {
                    Node<T> *next = copyHead->getNext();
                    delete copyHead;
                    copyHead = next;
                }
                throw;
            }
            return copyHead;
        }
        void clear() {
            while (head != NULL) {
                Node<T> *next = head->getNext();
                delete head;
                head = next;
            }
        }
    public:
        OrderedList() { head = NULL; }
        ~OrderedList() { clear(); }
        OrderedList(const OrderedList& other) : head(cloneChain(other.head)) {}
        OrderedList(OrderedList&& other) noexcept : head(other.head) {
            other.head = NULL;
        }
        OrderedList& operator=(OrderedList other) {
            swap(head, other.head);
            return *this;
        }
        Node<T>* getHead() const { return head; }
        bool isEmpty() const { return head == NULL; }
        int size() const {
            Node<T> *current = head;
            int count = 0;
            while (current != NULL) { count++; current = current->getNext(); }
            return count;
        }
        bool search(T item) const {
            Node<T> *current = head;
            while (current != NULL) {
                if (current->getData() == item) return true;
                else if (current->getData() > item) return false;
                current = current->getNext();
            }
            return false;
        }
        void add(T item) {
            Node<T> *newNode = new Node<T>(item);
            if (head == NULL || head->getData() >= item) {
                newNode->setNext(head);
                head = newNode;
            } else {
                Node<T> *current = head;
                while (current->getNext() != NULL && current->getNext()->getData() < item) {
                    current = current->getNext();
                }
                newNode->setNext(current->getNext());
                current->setNext(newNode);
            }
        }
        void remove(T item) {
            Node<T> *current = head;
            Node<T> *previous = NULL;
            while (current != NULL && current->getData() < item) {
                previous = current;
                current = current->getNext();
            }
            if (current == NULL || current->getData() != item) return;
            if (previous == NULL) head = current->getNext();
            else previous->setNext(current->getNext());
            delete current;
        }
        friend ostream& operator<<(ostream& os, const OrderedList<T>& ol) {
            Node<T> *current = ol.head;
            while (current != NULL) {
                os << current->getData() << " ";
                current = current->getNext();
            }
            return os;
        }
};
#endif
