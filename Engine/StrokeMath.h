#ifndef STROKEMATH_H
#define STROKEMATH_H

#include <QImage>
#include <QColor>
#include <QStack>
#include <QPoint>
#include <cmath>
#include <algorithm>

namespace StrokeMath {

inline void floodFill(QImage& img, int sx, int sy, const QColor& fill) {
    if (sx < 0 || sx >= img.width() || sy < 0 || sy >= img.height()) return;
    QRgb target = img.pixel(sx, sy);
    QRgb fillRgb = fill.rgba();
    if (target == fillRgb) return;

    QStack<QPoint> stack;
    stack.push({sx, sy});
    while (!stack.isEmpty()) {
        auto [x, y] = stack.pop();
        if (x < 0 || x >= img.width() || y < 0 || y >= img.height()) continue;
        if (img.pixel(x, y) != target) continue;
        img.setPixel(x, y, fillRgb);
        stack.push({x+1, y}); stack.push({x-1, y});
        stack.push({x, y+1}); stack.push({x, y-1});
    }
}

}
#endif // STROKEMATH_H