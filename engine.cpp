#include "engine.h"
#include <QStack>
#include <QPoint>
#include <cmath>
#include <QCoreApplication>

Engine::Engine(QObject* parent) : QObject(parent) {
    connect(&m_timeline, &Timeline::imageChanged, this, [this]{
        emit frameUpdated(compositeFrame());
    });

    m_tickTimer.setInterval(16);
    connect(&m_tickTimer, &QTimer::timeout, this, [this]{
        m_timeline.tick(0.016f);
    });
    m_tickTimer.start();
}

void Engine::setTool(int v)          { if (m_tool != v)      { m_tool = v;      emit toolChanged(); } }
void Engine::setBrushSize(int v)     { if (m_brushSize != v) { m_brushSize = v; emit brushSizeChanged(); } }
void Engine::setOpacity(float v)     { if (m_opacity != v)   { m_opacity = v;   emit opacityChanged(); } }
void Engine::setColor(const QString& h) {
    QColor c(h);
    if (c.isValid() && c != m_color) { m_color = c; emit colorChanged(); }
}

void Engine::beginStroke(qreal x, qreal y) {
    m_timeline.pushUndo();
    m_inStroke = true;

    m_smoothPos = QPointF(x, y);
    m_lastX = x;
    m_lastY = y;

    paintAt(x, y);
}

void Engine::endStroke() {
    m_inStroke = false;
    m_lastX = m_lastY = -1;
}

void Engine::paintAt(qreal x, qreal y) {
    if (m_tool == Eyedropper) { pickColor(x, y); return; }

    float oobDist = std::sqrt(std::pow(x - m_lastX, 2) + std::pow(y - m_lastY, 2));

    if (m_lastX < 0 || m_lastY < 0 || oobDist > 400) {
        m_lastX = x;
        m_lastY = y;
        m_smoothPos = QPointF(x, y);
    }

    QImage& img = m_timeline.currentImage();
    QPainter p(&img);

    float weight = 1.0f - m_smoothing;

    m_smoothPos.setX(m_smoothPos.x() + (x - m_smoothPos.x()) * weight);
    m_smoothPos.setY(m_smoothPos.y() + (y - m_smoothPos.y()) * weight);

    p.setRenderHint(QPainter::Antialiasing);
    p.setRenderHint(QPainter::SmoothPixmapTransform);

    QPen pen(m_color);
    pen.setWidth(m_brushSize);
    pen.setCapStyle(Qt::RoundCap);
    pen.setJoinStyle(Qt::RoundJoin);

    if (m_tool == Eraser) {
        p.setCompositionMode(QPainter::CompositionMode_Clear);
    } else {
        p.setCompositionMode(QPainter::CompositionMode_SourceOver);
        QColor brushColor = m_color;
        brushColor.setAlphaF(m_opacity);
        pen.setColor(brushColor);
    }

    p.setPen(pen);

    p.drawLine(QPointF(m_lastX, m_lastY), m_smoothPos);

    m_lastX = m_smoothPos.x();
    m_lastY = m_smoothPos.y();

    emit m_timeline.imageChanged();
}

void Engine::pickColor(qreal x, qreal y) {
    const QImage& img = m_timeline.currentImage();
    int px = std::clamp((int)x, 0, img.width()-1);
    int py = std::clamp((int)y, 0, img.height()-1);
    QColor picked = img.pixelColor(px, py);
    m_color = picked;
    emit colorChanged();
    emit colorPicked(picked.name());
}

void Engine::drawCircle(QImage& img, qreal cx, qreal cy) {
    int r = m_brushSize;
    int x0 = std::max(0, (int)(cx - r) - 1);
    int y0 = std::max(0, (int)(cy - r) - 1);
    int x1 = std::min(img.width()-1,  (int)(cx + r) + 1);
    int y1 = std::min(img.height()-1, (int)(cy + r) + 1);

    for (int py = y0; py <= y1; py++) {
        QRgb* line = reinterpret_cast<QRgb*>(img.scanLine(py));
        for (int px = x0; px <= x1; px++) {
            float dx = px - cx, dy = py - cy;
            float dist = std::sqrt(dx*dx + dy*dy);
            if (dist > r) continue;

            float t = 1.f - (dist / r);
            t = t * t;
            float a = m_opacity * t;

            QColor src = (m_tool == Eraser) ? QColor(255,255,255,0) : m_color;

            if (m_tool == Eraser) {
                QColor dst = QColor::fromRgba(line[px]);
                int newA = (int)(dst.alpha() * (1.f - a));
                line[px] = QColor(dst.red(), dst.green(), dst.blue(), newA).rgba();
            } else {
                QColor dst = QColor::fromRgba(line[px]);
                float srcA = a * (src.alphaF());
                float dstA = dst.alphaF() * (1.f - srcA);
                float outA = srcA + dstA;
                if (outA <= 0) continue;
                int r2 = (int)((src.red()   * srcA + dst.red()   * dstA) / outA);
                int g  = (int)((src.green() * srcA + dst.green() * dstA) / outA);
                int b  = (int)((src.blue()  * srcA + dst.blue()  * dstA) / outA);
                line[px] = QColor(r2, g, b, (int)(outA * 255)).rgba();
            }
        }
    }
}

void Engine::floodFill(QImage& img, int sx, int sy, const QColor& fill) {
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
        stack.push({x+1,y}); stack.push({x-1,y});
        stack.push({x,y+1}); stack.push({x,y-1});
    }
}

QImage Engine::compositeFrame() const {
    const QImage& cur = const_cast<Timeline&>(m_timeline).currentImage();
    int w = cur.width(), h = cur.height();

    QImage out(w, h, QImage::Format_ARGB32_Premultiplied);
    out.fill(Qt::white);

    QPainter p(&out);
    p.setRenderHint(QPainter::SmoothPixmapTransform);

    int ci = m_timeline.currentFrame();

    bool showOnion = !m_timeline.playing();
    if (showOnion && m_timeline.onionBack()) {
        for (int d = 2; d >= 1; d--) {
            QImage ghost = m_timeline.imageAt(ci - d);
            if (ghost.isNull()) continue;
            float a = m_timeline.onionAlpha() / (float)d;
            p.setOpacity(a);
            p.setCompositionMode(QPainter::CompositionMode_SourceOver);
            p.drawImage(0, 0, ghost);
        }
    }

    if (showOnion && m_timeline.onionForward()) {
        QImage ghost = m_timeline.imageAt(ci + 1);
        if (!ghost.isNull()) {
            p.setOpacity(m_timeline.onionAlpha());
            p.drawImage(0, 0, ghost);
        }
    }

    p.setOpacity(1.0);
    p.drawImage(0, 0, cur);

    return out;
}

void Engine::terminateAnima(int returnCode) {
    QCoreApplication::exit(returnCode);
}

void Engine::newProject() {
    m_timeline.clearAll();
    emit frameUpdated(compositeFrame());
}

void Engine::setSmoothing(float v) {
    if (m_smoothing != v) {
        m_smoothing = v;
        emit smoothingChanged();
    }
}