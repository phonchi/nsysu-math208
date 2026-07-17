// dscpp/sparsematrix.hpp -- Dictionary-Of-Keys sparse matrix (Chapter 3)
#ifndef DSCPP_SPARSEMATRIX_HPP
#define DSCPP_SPARSEMATRIX_HPP
#include <iostream>
#include <map>
#include <vector>
using namespace std;

class SparseMatrix {
    public:
        SparseMatrix() {}
        SparseMatrix(map<pair<size_t, size_t>, double> d) { data = d; }
        void fromDenseMatrix(const vector<vector<double>>& matrix) {
            for (size_t i = 0; i < matrix.size(); ++i)
                for (size_t j = 0; j < matrix[i].size(); ++j)
                    if (matrix[i][j] != 0) data[{i, j}] = matrix[i][j];
        }
        double operator()(size_t i, size_t j) const {
            auto it = data.find({i, j});
            return it != data.end() ? it->second : 0.0;
        }
        double& operator()(size_t i, size_t j) { return data[{i, j}]; }
        SparseMatrix operator+(const SparseMatrix& other) const {
            SparseMatrix result;
            for (const auto& item : data)
                result.data[item.first] = item.second + other(item.first.first, item.first.second);
            for (const auto& item : other.data)
                if (data.find(item.first) == data.end()) result.data[item.first] = item.second;
            return result;
        }
        SparseMatrix operator-(const SparseMatrix& other) const {
            SparseMatrix result;
            for (const auto& item : data)
                result.data[item.first] = item.second - other(item.first.first, item.first.second);
            for (const auto& item : other.data)
                if (data.find(item.first) == data.end()) result.data[item.first] = -item.second;
            return result;
        }
        SparseMatrix operator*(const SparseMatrix& other) const {
            SparseMatrix result;
            for (const auto& item1 : data)
                for (const auto& item2 : other.data)
                    if (item1.first.second == item2.first.first)
                        result(item1.first.first, item2.first.second) += item1.second * item2.second;
            return result;
        }
        friend ostream& operator<<(ostream& os, const SparseMatrix& m) {
            for (const auto& item : m.data)
                os << "(" << item.first.first << ", " << item.first.second << "): " << item.second << "  ";
            return os;
        }
    private:
        map<pair<size_t, size_t>, double> data;
};
#endif
