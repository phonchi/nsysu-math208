// dscpp/bst.hpp -- BinarySearchTree with three-case delete (Chapter 9)
#ifndef DSCPP_BST_HPP
#define DSCPP_BST_HPP
#include <iostream>
#include <string>
#include <stdexcept>
using namespace std;

class TreeNode {
    public:
        string key;
        string value;
        TreeNode* leftChild;
        TreeNode* rightChild;
        TreeNode* parent;
        TreeNode(string k, string v, TreeNode* p = NULL) {
            key = k;
            value = v;
            leftChild = NULL;
            rightChild = NULL;
            parent = p;
        }
        bool isLeftChild() { return parent != NULL && parent->leftChild == this; }
        bool isRightChild() { return parent != NULL && parent->rightChild == this; }
        bool isLeaf() { return leftChild == NULL && rightChild == NULL; }
        bool hasAnyChild() { return leftChild != NULL || rightChild != NULL; }
        bool hasBothChildren() { return leftChild != NULL && rightChild != NULL; }
        TreeNode* findMin() {
            TreeNode* current = this;
            while (current->leftChild != NULL) current = current->leftChild;
            return current;
        }
        TreeNode* findSuccessor() { return rightChild->findMin(); }
        void spliceOut() {
            if (isLeaf()) {
                if (isLeftChild()) parent->leftChild = NULL;
                else parent->rightChild = NULL;
            } else if (hasAnyChild()) {
                TreeNode* child = (leftChild != NULL) ? leftChild : rightChild;
                if (isLeftChild()) parent->leftChild = child;
                else parent->rightChild = child;
                child->parent = parent;
            }
        }
};

class BinarySearchTree {
    public:
        TreeNode* root;
        int size;
        BinarySearchTree() { root = NULL; size = 0; }
        int length() { return size; }
        void put(string key, string value) {
            if (root != NULL) _put(key, value, root);
            else root = new TreeNode(key, value);
            size = size + 1;
        }
        void _put(string key, string value, TreeNode* currentNode) {
            if (key < currentNode->key) {
                if (currentNode->leftChild != NULL)
                    _put(key, value, currentNode->leftChild);
                else
                    currentNode->leftChild = new TreeNode(key, value, currentNode);
            } else {
                if (currentNode->rightChild != NULL)
                    _put(key, value, currentNode->rightChild);
                else
                    currentNode->rightChild = new TreeNode(key, value, currentNode);
            }
        }
        string get(string key) {
            if (root != NULL) {
                TreeNode* result = _get(key, root);
                if (result != NULL) return result->value;
            }
            return "";
        }
        TreeNode* _get(string key, TreeNode* currentNode) {
            if (currentNode == NULL) return NULL;
            if (currentNode->key == key) return currentNode;
            if (key < currentNode->key) return _get(key, currentNode->leftChild);
            return _get(key, currentNode->rightChild);
        }
        void remove(string key) {
            TreeNode* nodeToRemove = _get(key, root);
            if (nodeToRemove == NULL) throw invalid_argument("Error, key not in tree");
            _delete(nodeToRemove);
            size = size - 1;
        }
        void _delete(TreeNode* current) {
            if (current->isLeaf() && current->parent != NULL) {
                current->spliceOut();
            } else if (current->hasBothChildren()) {
                TreeNode* successor = current->findSuccessor();
                successor->spliceOut();
                current->key = successor->key;
                current->value = successor->value;
            } else {
                TreeNode* child = (current->leftChild != NULL)
                                  ? current->leftChild : current->rightChild;
                if (current->parent == NULL) {
                    root = child;
                    if (child != NULL) child->parent = NULL;
                } else {
                    current->spliceOut();
                }
            }
        }
        void inorder(TreeNode* node) {
            if (node != NULL) {
                inorder(node->leftChild);
                cout << node->value << " ";
                inorder(node->rightChild);
            }
        }
};
#endif
