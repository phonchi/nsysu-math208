// dscpp/gates.hpp -- the logic-gate hierarchy from Chapter 1 (NSYSU MATH208)
#ifndef DSCPP_GATES_HPP
#define DSCPP_GATES_HPP
#include <iostream>
#include <string>
using namespace std;

class Connector;

class LogicGate {
    public:
        LogicGate(string n) { label = n; }
        string getLabel() { return label; }
        int getOutput() { output = performGateLogic(); return output; }
        virtual int performGateLogic() = 0;
        virtual void setNextPin(Connector* source) = 0;
    protected:
        string label;
        int output;
};

class Connector {
    public:
        Connector(LogicGate* fgate, LogicGate* tgate);
        LogicGate* getFrom() { return fromGate; }
    private:
        LogicGate* fromGate;
        LogicGate* toGate;
};

class BinaryGate : public LogicGate {
    public:
        BinaryGate(string n) : LogicGate(n) { pinA = NULL; pinB = NULL; }
        int getPinA() {
            if (pinA == NULL) {
                int in;
                cout << "Enter pin A input for gate " << getLabel() << ": ";
                cin >> in;
                return in;
            } else {
                return pinA->getFrom()->getOutput();
            }
        }
        int getPinB() {
            if (pinB == NULL) {
                int in;
                cout << "Enter pin B input for gate " << getLabel() << ": ";
                cin >> in;
                return in;
            } else {
                return pinB->getFrom()->getOutput();
            }
        }
        void setNextPin(Connector* source) {
            if (pinA == NULL) {
                pinA = source;
            } else if (pinB == NULL) {
                pinB = source;
            } else {
                cout << "Cannot Connect: NO EMPTY PINS on this gate" << endl;
            }
        }
    protected:
        Connector* pinA;
        Connector* pinB;
};

class UnaryGate : public LogicGate {
    public:
        UnaryGate(string n) : LogicGate(n) { pin = NULL; }
        int getPin() {
            if (pin == NULL) {
                int in;
                cout << "Enter pin input for gate " << getLabel() << ": ";
                cin >> in;
                return in;
            } else {
                return pin->getFrom()->getOutput();
            }
        }
        void setNextPin(Connector* source) {
            if (pin == NULL) {
                pin = source;
            } else {
                cout << "Cannot Connect: NO EMPTY PINS on this gate" << endl;
            }
        }
    protected:
        Connector* pin;
};

Connector::Connector(LogicGate* fgate, LogicGate* tgate) {
    fromGate = fgate;
    toGate = tgate;
    tgate->setNextPin(this);
}

class AndGate : public BinaryGate {
    public:
        AndGate(string n) : BinaryGate(n) {}
        int performGateLogic() {
            return (getPinA() == 1 && getPinB() == 1) ? 1 : 0;
        }
};

class OrGate : public BinaryGate {
    public:
        OrGate(string n) : BinaryGate(n) {}
        int performGateLogic() {
            return (getPinA() == 1 || getPinB() == 1) ? 1 : 0;
        }
};

class NotGate : public UnaryGate {
    public:
        NotGate(string n) : UnaryGate(n) {}
        int performGateLogic() {
            return getPin() ? 0 : 1;
        }
};
#endif
