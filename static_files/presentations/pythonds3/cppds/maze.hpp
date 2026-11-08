// pythonds3/cppds/maze.hpp -- maze and recursive solver, with optional CTurtle GUI
#ifndef DSCPP_MAZE_HPP
#define DSCPP_MAZE_HPP
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <memory>
#include <stdexcept>
#include "detail/maze_gui.hpp"
using namespace std;

const char START = 'S';
const char OBSTACLE = '+';
const char TRIED = '.';
const char DEAD_END = '-';
const char PART_OF_PATH = 'O';

class Maze {
    public:
        Maze(string mazeFilename, bool useGui = false) {
            ifstream mazeFile(mazeFilename);
            // A student only needs the notebook: use packaged sample data if
            // the named file is absent locally. A local file always wins.
            if (!mazeFile && mazeFilename.find_first_of("/\\") == string::npos) {
                mazeFile.clear();
                const string header = __FILE__;
                const auto slash = header.find_last_of("/\\");
                mazeFile.open(header.substr(0, slash + 1) + "data/" + mazeFilename);
            }
            if (!mazeFile) throw runtime_error("Cannot open maze: " + mazeFilename);
            string line;
            while (getline(mazeFile, line)) {
                if (!line.empty() && line.back() == '\r') line.pop_back();
                if (!line.empty()) mazeList.push_back(line);
            }
            if (mazeList.empty()) throw runtime_error("Maze is empty: " + mazeFilename);
            rowsInMaze = mazeList.size();
            columnsInMaze = mazeList[0].size();
            for (const string& row : mazeList) {
                if (row.size() != static_cast<size_t>(columnsInMaze))
                    throw runtime_error("Maze rows must have equal width");
            }
            startRow = -1;
            startCol = -1;
            for (int row = 0; row < rowsInMaze; row++) {
                size_t col = mazeList[row].find(START);
                if (col != string::npos) {
                    startRow = row;
                    startCol = col;
                    break;
                }
            }
            if (startRow < 0) throw runtime_error("Maze has no starting position S");
            if (useGui) gui = make_unique<cppds_detail::MazeGui>(mazeList);
        }
        char get(int row, int col) { return mazeList[row][col]; }
        void updatePosition(int row, int col, char val) {
            mazeList[row][col] = val;
            if (gui) gui->update(row, col, val);
        }
        // GUI turtle shape: "snorlax" (default), "pikachu", "turtle", "arrow", ...
        // Text-only mode ignores it.
        void setShape(const string& name) {
            if (gui) gui->setShape(name);
        }
        // Zero means wait for the user to close the window.
        void waitForClose(unsigned timeoutMilliseconds = 0) {
            if (gui) gui->wait(timeoutMilliseconds);
        }
        void saveGuiImage(const string& filename) {
            if (gui) gui->save(filename);
        }
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
        unique_ptr<cppds_detail::MazeGui> gui;
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
