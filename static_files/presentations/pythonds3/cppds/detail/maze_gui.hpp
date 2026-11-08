#ifndef CPPDS_MAZE_GUI_HPP
#define CPPDS_MAZE_GUI_HPP

#include <stdexcept>
#include <string>
#include <vector>

#ifdef CPPDS_MAZE_ENABLE_GUI
// Keep the notebook kernel's stdio wrapper macros out of third-party headers.
#pragma push_macro("printf")
#undef printf
#pragma push_macro("putchar")
#undef putchar
#pragma push_macro("fflush")
#undef fflush
#pragma push_macro("fclose")
#undef fclose
#pragma push_macro("scanf")
#undef scanf
#pragma push_macro("getchar")
#undef getchar
#pragma push_macro("M_PI")
#undef M_PI
#define M_PI 3.141592653589793238462643383279502884
#include "cturtle/CTurtle.hpp"
#pragma pop_macro("M_PI")
#pragma pop_macro("getchar")
#pragma pop_macro("scanf")
#pragma pop_macro("fclose")
#pragma pop_macro("fflush")
#pragma pop_macro("putchar")
#pragma pop_macro("printf")
#include "maze_sprites.hpp"
#include <chrono>
#include <thread>

namespace ct = cturtle;
namespace cppds_detail {
class MazeGui {
public:
    explicit MazeGui(const std::vector<std::string>& grid)
        : turtle(screen), rows(static_cast<int>(grid.size())),
          cols(static_cast<int>(grid.front().size())) {
        // Same wall geometry, state colors, and animation as HW3's Maze.
        screen.tracer(0, 0);
        turtle.speed(ct::TS_FASTEST);
        turtle.penup();
        for (int row = 0; row < rows; ++row) {
            for (int col = 0; col < cols; ++col) {
                if (grid[row][col] != '+') continue;
                turtle.goTo((col - cols / 2) * 20, (rows / 2 - row) * 20);
                turtle.begin_fill();
                turtle.fillcolor(ct::Color("orange"));
                for (int side = 0; side < 4; ++side) {
                    turtle.forward(20);
                    turtle.right(90);
                }
                turtle.end_fill();
            }
        }
        screen.update(true, false);
        screen.tracer(10, 10);
        turtle.speed(ct::TS_SLOW);
        maze_sprites::setShape(turtle, "snorlax");  // like the Python HW3 maze
    }
    void setShape(const std::string& name) {
        maze_sprites::setShape(turtle, name);
    }
    void update(int row, int col, char value) {
        if (screen.isclosed()) return;
        turtle.goTo((col - cols / 2) * 20 + 10, (rows / 2 - row) * 20 - 10);
        if (value == 'O') turtle.dot(ct::Color("green"), 10);
        else if (value == '.') turtle.dot(ct::Color("blue"), 10);
        else if (value == '-') turtle.dot(ct::Color("red"), 10);
    }
    void wait(unsigned timeoutMilliseconds) {
        if (screen.isclosed()) return;
        screen.update(true, false);
        const auto begin = std::chrono::steady_clock::now();
        while (!screen.isclosed()) {
            screen.update(false, true);
            if (timeoutMilliseconds && std::chrono::steady_clock::now() - begin >=
                std::chrono::milliseconds(timeoutMilliseconds)) break;
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
    }
    void save(const std::string& filename) {
        if (screen.isclosed()) throw std::runtime_error("Maze window is closed");
        screen.update(true, false);
        screen.save(filename);
    }
private:
    ct::TurtleScreen screen;
    ct::Turtle turtle;
    int rows, cols;
};
}

#else
namespace cppds_detail {
class MazeGui {
public:
    explicit MazeGui(const std::vector<std::string>&) {
        throw std::runtime_error(
            "Maze GUI is unavailable. Update the course C++ kernel and restart it. "
            "On Linux, X11 development headers/libraries and a display are also required. "
            "Use Maze(filename, false) for text-only execution.");
    }
    void update(int, int, char) {}
    void setShape(const std::string&) {}
    void wait(unsigned) {}
    void save(const std::string&) {}
};
}
#endif
#endif
