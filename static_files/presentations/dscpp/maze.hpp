// dscpp/maze.hpp -- text-based maze and recursive solver (Chapter 6)
#ifndef DSCPP_MAZE_HPP
#define DSCPP_MAZE_HPP
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
using namespace std;

const char START = 'S';
const char OBSTACLE = '+';
const char TRIED = '.';
const char DEAD_END = '-';
const char PART_OF_PATH = 'O';

class Maze {
    public:
        Maze(string mazeFilename) {
            ifstream mazeFile(mazeFilename);
            string line;
            while (getline(mazeFile, line)) {
                if (!line.empty()) mazeList.push_back(line);
            }
            rowsInMaze = mazeList.size();
            columnsInMaze = mazeList[0].size();
            startRow = 0;
            startCol = 0;
            for (int row = 0; row < rowsInMaze; row++) {
                size_t col = mazeList[row].find(START);
                if (col != string::npos) {
                    startRow = row;
                    startCol = col;
                    break;
                }
            }
        }
        char get(int row, int col) { return mazeList[row][col]; }
        void updatePosition(int row, int col, char val) { mazeList[row][col] = val; }
        bool isExit(int row, int col) {
            return (row == 0 || row == rowsInMaze - 1 || col == 0 || col == columnsInMaze - 1);
        }
        void print() {
            for (string& row : mazeList) cout << row << endl;
        }
        int startRow;
        int startCol;
    private:
        vector<string> mazeList;
        int rowsInMaze;
        int columnsInMaze;
};

bool searchFrom(Maze& maze, int row, int column) {
    if (maze.get(row, column) == OBSTACLE) return false;
    if (maze.get(row, column) == TRIED || maze.get(row, column) == DEAD_END) return false;
    if (maze.isExit(row, column)) {
        maze.updatePosition(row, column, PART_OF_PATH);
        return true;
    }
    maze.updatePosition(row, column, TRIED);
    bool found = searchFrom(maze, row - 1, column)
              || searchFrom(maze, row + 1, column)
              || searchFrom(maze, row, column - 1)
              || searchFrom(maze, row, column + 1);
    if (found) maze.updatePosition(row, column, PART_OF_PATH);
    else maze.updatePosition(row, column, DEAD_END);
    return found;
}
#endif
