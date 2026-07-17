// dscpp/dstimer.hpp -- tiny benchmarking helper (Chapter 2, NSYSU MATH208)
#ifndef DSCPP_DSTIMER_HPP
#define DSCPP_DSTIMER_HPP
#include <chrono>

// Usage:  DSTimer t;  ... work ...  double s = t.seconds();
class DSTimer {
    public:
        DSTimer() { start = std::chrono::steady_clock::now(); }
        void reset() { start = std::chrono::steady_clock::now(); }
        double seconds() {
            auto end = std::chrono::steady_clock::now();
            return std::chrono::duration<double>(end - start).count();
        }
        double millis() { return seconds() * 1000.0; }
    private:
        std::chrono::steady_clock::time_point start;
};
#endif
