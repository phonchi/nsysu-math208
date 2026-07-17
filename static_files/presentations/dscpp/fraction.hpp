// dscpp/fraction.hpp -- the Fraction class from Chapter 1 (NSYSU MATH208)
#ifndef DSCPP_FRACTION_HPP
#define DSCPP_FRACTION_HPP
#include <iostream>
using namespace std;

int gcd(int m, int n) {
    while (m % n != 0) {
        int oldm = m;
        int oldn = n;
        m = oldn;
        n = oldm % oldn;
    }
    return n;
}

class Fraction {
    public:
        Fraction(int top, int bottom) {   // two arguments
            num = top;
            den = bottom;
        }
        Fraction(int top) {               // whole number: top/1
            num = top;
            den = 1;
        }
        Fraction() {                      // no arguments: 1/1
            num = 1;
            den = 1;
        }
        Fraction operator+(Fraction otherFrac) {
            int newnum = num * otherFrac.den + den * otherFrac.num;
            int newden = den * otherFrac.den;
            int common = gcd(newnum, newden);
            return Fraction(newnum / common, newden / common);
        }
        bool operator==(Fraction& otherFrac) {
            int firstnum = num * otherFrac.den;
            int secondnum = otherFrac.num * den;
            return firstnum == secondnum;
        }
    friend ostream& operator<<(ostream& stream, const Fraction& fraction);
    private:
        int num, den;
};

ostream& operator<<(ostream& stream, const Fraction& fraction) {
    stream << fraction.num << "/" << fraction.den;
    return stream;
}
#endif
