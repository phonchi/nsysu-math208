// dscpp/binarytree.hpp -- BinaryTree, parse tree, traversals (Chapter 9)
#ifndef DSCPP_BINARYTREE_HPP
#define DSCPP_BINARYTREE_HPP
#include <iostream>
#include <string>
#include <stack>
#include <sstream>
using namespace std;

class BinaryTree {
    public:
        string key;
        BinaryTree* leftChild;
        BinaryTree* rightChild;
        BinaryTree(string rootObj) {
            key = rootObj;
            leftChild = NULL;
            rightChild = NULL;
        }
        void insertLeft(string newNode) {
            if (leftChild == NULL) {
                leftChild = new BinaryTree(newNode);
            } else {
                BinaryTree* newChild = new BinaryTree(newNode);
                newChild->leftChild = leftChild;
                leftChild = newChild;
            }
        }
        void insertRight(string newNode) {
            if (rightChild == NULL) {
                rightChild = new BinaryTree(newNode);
            } else {
                BinaryTree* newChild = new BinaryTree(newNode);
                newChild->rightChild = rightChild;
                rightChild = newChild;
            }
        }
        string getRootVal() { return key; }
        void setRootVal(string newKey) { key = newKey; }
        BinaryTree* getLeftChild() { return leftChild; }
        BinaryTree* getRightChild() { return rightChild; }
};

BinaryTree* buildParseTree(string fpExpr) {
    stack<BinaryTree*> pStack;
    BinaryTree* exprTree = new BinaryTree("");
    pStack.push(exprTree);
    BinaryTree* currentTree = exprTree;
    stringstream ss(fpExpr);
    string i;
    while (ss >> i) {
        if (i == "(") {
            currentTree->insertLeft("");
            pStack.push(currentTree);
            currentTree = currentTree->getLeftChild();
        } else if (i == "+" || i == "-" || i == "*" || i == "/") {
            currentTree->setRootVal(i);
            currentTree->insertRight("");
            pStack.push(currentTree);
            currentTree = currentTree->getRightChild();
        } else if (i == ")") {
            currentTree = pStack.top();
            pStack.pop();
        } else {
            currentTree->setRootVal(i);
            currentTree = pStack.top();
            pStack.pop();
        }
    }
    return exprTree;
}

void preorder(BinaryTree* tree) {
    if (tree != NULL) {
        cout << tree->getRootVal() << " ";
        preorder(tree->getLeftChild());
        preorder(tree->getRightChild());
    }
}

void postorder(BinaryTree* tree) {
    if (tree != NULL) {
        postorder(tree->getLeftChild());
        postorder(tree->getRightChild());
        cout << tree->getRootVal() << " ";
    }
}

void inorder(BinaryTree* tree) {
    if (tree != NULL) {
        inorder(tree->getLeftChild());
        cout << tree->getRootVal() << " ";
        inorder(tree->getRightChild());
    }
}

double evaluate(BinaryTree* parseTree) {
    BinaryTree* leftChild = parseTree->getLeftChild();
    BinaryTree* rightChild = parseTree->getRightChild();
    if (leftChild != NULL && rightChild != NULL) {
        string op = parseTree->getRootVal();
        if (op == "+") return evaluate(leftChild) + evaluate(rightChild);
        if (op == "-") return evaluate(leftChild) - evaluate(rightChild);
        if (op == "*") return evaluate(leftChild) * evaluate(rightChild);
        return evaluate(leftChild) / evaluate(rightChild);
    } else {
        return stod(parseTree->getRootVal());
    }
}

double postordereval(BinaryTree* tree) {
    if (tree == NULL) return 0;
    if (tree->getLeftChild() != NULL && tree->getRightChild() != NULL) {
        double result1 = postordereval(tree->getLeftChild());
        double result2 = postordereval(tree->getRightChild());
        string op = tree->getRootVal();
        if (op == "+") return result1 + result2;
        if (op == "-") return result1 - result2;
        if (op == "*") return result1 * result2;
        return result1 / result2;
    }
    return stod(tree->getRootVal());
}

string printExp(BinaryTree* tree) {
    string result = "";
    if (tree != NULL) {
        result = "(" + printExp(tree->getLeftChild());
        result = result + tree->getRootVal();
        result = result + printExp(tree->getRightChild()) + ")";
    }
    return result;
}
#endif
