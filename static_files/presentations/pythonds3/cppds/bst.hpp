// pythonds3/cppds/bst.hpp -- BinarySearchTree with three-case delete (Chapter 9)
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
        virtual ~TreeNode() = default;
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
    private:
        static TreeNode* clone(TreeNode* node, TreeNode* parent = NULL) {
            if (node == NULL) return NULL;
            TreeNode* copy = new TreeNode(node->key, node->value, parent);
            try {
                copy->leftChild = clone(node->leftChild, copy);
                copy->rightChild = clone(node->rightChild, copy);
            } catch (...) {
                destroy(copy);
                throw;
            }
            return copy;
        }
        static void destroy(TreeNode* node) {
            if (node == NULL) return;
            destroy(node->leftChild);
            destroy(node->rightChild);
            delete node;
        }
    protected:
        // Extension seam used by balanced search trees. The reference lets an
        // override allocate a derived node when the destination slot is empty.
        virtual bool insertOrAssign(string key, string value,
                                    TreeNode*& slot, TreeNode* parent) {
            if (slot == NULL) {
                slot = new TreeNode(key, value, parent);
                return true;
            }
            TreeNode* currentNode = slot;
            if (key == currentNode->key) {
                currentNode->value = value;
                return false;
            }
            if (key < currentNode->key) {
                return insertOrAssign(key, value,
                                      currentNode->leftChild, currentNode);
            } else {
                return insertOrAssign(key, value,
                                      currentNode->rightChild, currentNode);
            }
        }
    public:
        TreeNode* root;
        int size;
        BinarySearchTree() { root = NULL; size = 0; }
        ~BinarySearchTree() { destroy(root); }
        BinarySearchTree(const BinarySearchTree& other)
            : root(clone(other.root)), size(other.size) {}
        BinarySearchTree& operator=(const BinarySearchTree& other) {
            if (this != &other) {
                TreeNode* replacement = clone(other.root);
                destroy(root);
                root = replacement;
                size = other.size;
            }
            return *this;
        }
        BinarySearchTree(BinarySearchTree&& other) noexcept
            : root(other.root), size(other.size) {
            other.root = NULL;
            other.size = 0;
        }
        BinarySearchTree& operator=(BinarySearchTree&& other) noexcept {
            if (this != &other) {
                destroy(root);
                root = other.root;
                size = other.size;
                other.root = NULL;
                other.size = 0;
            }
            return *this;
        }
        int length() const { return size; }
        void put(string key, string value) {
            if (insertOrAssign(key, value, root, NULL)) size = size + 1;
        }
        void _put(string key, string value, TreeNode* currentNode) {
            if (currentNode == NULL) return;
            TreeNode* slot = currentNode;
            insertOrAssign(key, value, slot, currentNode->parent);
        }
        string get(string key) {
            if (root != NULL) {
                TreeNode* result = _get(key, root);
                if (result != NULL) return result->value;
            }
            return "";
        }
        bool contains(string key) { return _get(key, root) != NULL; }
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
                delete current;
            } else if (current->hasBothChildren()) {
                TreeNode* successor = current->findSuccessor();
                successor->spliceOut();
                current->key = successor->key;
                current->value = successor->value;
                delete successor;
            } else {
                TreeNode* child = (current->leftChild != NULL)
                                  ? current->leftChild : current->rightChild;
                if (current->parent == NULL) {
                    root = child;
                    if (child != NULL) child->parent = NULL;
                } else {
                    current->spliceOut();
                }
                delete current;
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
