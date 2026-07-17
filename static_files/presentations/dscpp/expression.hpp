// dscpp/expression.hpp -- infix/postfix expression tools (Chapter 5)
#ifndef DSCPP_EXPRESSION_HPP
#define DSCPP_EXPRESSION_HPP
#include <iostream>
#include <stack>
#include <vector>
#include <map>
#include <sstream>
#include <string>
#include <cctype>
using namespace std;

string infixToPostfix(string infixExpr) {
    map<string, int> prec = {{"*", 3}, {"/", 3}, {"+", 2}, {"-", 2}, {"(", 1}};
    stack<string> opStack;
    vector<string> postfixList;
    stringstream ss(infixExpr);
    string token;
    while (ss >> token) {
        if (isalnum(token[0])) {
            postfixList.push_back(token);
        } else if (token == "(") {
            opStack.push(token);
        } else if (token == ")") {
            while (!opStack.empty() && opStack.top() != "(") {
                postfixList.push_back(opStack.top());
                opStack.pop();
            }
            opStack.pop();
        } else {
            while (!opStack.empty() && prec[opStack.top()] >= prec[token]) {
                postfixList.push_back(opStack.top());
                opStack.pop();
            }
            opStack.push(token);
        }
    }
    while (!opStack.empty()) {
        postfixList.push_back(opStack.top());
        opStack.pop();
    }
    string result = "";
    for (unsigned i = 0; i < postfixList.size(); i++) {
        if (i > 0) result += " ";
        result += postfixList[i];
    }
    return result;
}

double doMath(string op, double op1, double op2) {
    if (op == "*") return op1 * op2;
    else if (op == "/") return op1 / op2;
    else if (op == "+") return op1 + op2;
    else return op1 - op2;
}

double postfixEval(string postfixExpr) {
    stack<double> operandStack;
    stringstream ss(postfixExpr);
    string token;
    while (ss >> token) {
        if (isdigit(token[0])) {
            operandStack.push(stod(token));
        } else {
            double operand2 = operandStack.top(); operandStack.pop();
            double operand1 = operandStack.top(); operandStack.pop();
            operandStack.push(doMath(token, operand1, operand2));
        }
    }
    return operandStack.top();
}
#endif
