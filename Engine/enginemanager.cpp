#include "enginemanager.h"
#include "StrokeMath.h"
#include <QCoreApplication>

EngineManager::EngineManager(QObject* parent) : QObject(parent) {
    connect(&m_timeline, &Timeline::imageChanged, this, [this]{
        emit frameUpdated(compositeFrame());
        m_fileio.markDirty();
    });

    connect(&m_timeline, &Timeline::playingChanged, this, [this]{
        emit frameUpdated(compositeFrame());
    });

    m_tickTimer.setInterval(16);
    connect(&m_tickTimer, &QTimer::timeout, this, [this]{
        m_timeline.tick(0.016f);
    });
    m_tickTimer.start();
}

void EngineManager::beginStroke(qreal x, qreal y) {
    m_timeline.pushUndo();
    m_inStroke = true;
    m_smoothPos = QPointF(x, y);
    m_lastX = x;
    m_lastY = y;
    paintAt(x, y);
}

void EngineManager::endStroke() {
    m_inStroke = false;
    m_lastX = m_lastY = -1;
}

void EngineManager::paintAt(qreal x, qreal y) {
    // Look how we ask the ToolHandler for the info!
    if (m_tools.tool() == ToolHandler::Eyedropper) { pickColor(x, y); return; }

    float oobDist = std::sqrt(std::pow(x - m_lastX, 2) + std::pow(y - m_lastY, 2));
    if (m_lastX < 0 || m_lastY < 0 || oobDist > 400) {
        m_lastX = x; m_lastY = y;
        m_smoothPos = QPointF(x, y);
    }

    QImage& img = m_timeline.currentImage();

    // If Bucket, use our new Math namespace!
    if (m_tools.tool() == ToolHandler::Bucket) {
        StrokeMath::floodFill(img, (int)x, (int)y, m_tools.rawColor());
        emit m_timeline.imageChanged();
        return;
    }

    QPainter p(&img);
    float weight = 1.0f - m_tools.smoothing();

    m_smoothPos.setX(m_smoothPos.x() + (x - m_smoothPos.x()) * weight);
    m_smoothPos.setY(m_smoothPos.y() + (y - m_smoothPos.y()) * weight);

    p.setRenderHint(QPainter::Antialiasing);
    p.setRenderHint(QPainter::SmoothPixmapTransform);

    QPen pen(m_tools.rawColor());
    pen.setWidth(m_tools.brushSize());
    pen.setCapStyle(Qt::RoundCap);
    pen.setJoinStyle(Qt::RoundJoin);

    if (m_tools.tool() == ToolHandler::Eraser) {
        p.setCompositionMode(QPainter::CompositionMode_Clear);
    } else {
        p.setCompositionMode(QPainter::CompositionMode_SourceOver);
        QColor brushColor = m_tools.rawColor();
        brushColor.setAlphaF(m_tools.opacity());
        pen.setColor(brushColor);
    }

    p.setPen(pen);
    p.drawLine(QPointF(m_lastX, m_lastY), m_smoothPos);

    m_lastX = m_smoothPos.x();
    m_lastY = m_smoothPos.y();

    emit m_timeline.imageChanged();
}

void EngineManager::pickColor(qreal x, qreal y) {
    const QImage& img = m_timeline.currentImage();
    int px = std::clamp((int)x, 0, img.width()-1);
    int py = std::clamp((int)y, 0, img.height()-1);
    QColor picked = img.pixelColor(px, py);

    m_tools.setColor(picked.name()); // Tell the ToolHandler we picked a color!
    emit colorPicked(picked.name());
}

QImage EngineManager::compositeFrame() const {
    // Exactly the same logic as your old Engine
    const QImage& cur = const_cast<Timeline&>(m_timeline).currentImage();
    int w = cur.width(), h = cur.height();
    QImage out(w, h, QImage::Format_ARGB32_Premultiplied);
    out.fill(Qt::white);
    QPainter p(&out);
    p.setRenderHint(QPainter::SmoothPixmapTransform);
    int ci = m_timeline.currentFrame();

    bool showOnion = !m_timeline.playing();
    if (showOnion && m_timeline.onionBack() && showOnion == true) {
        for (int d = 2; d >= 1; d--) {
            QImage ghost = m_timeline.imageAt(ci - d);
            if (ghost.isNull()) continue;
            float a = m_timeline.onionAlpha() / (float)d;
            p.setOpacity(a);
            p.setCompositionMode(QPainter::CompositionMode_SourceOver);
            p.drawImage(0, 0, ghost);
        }
    }
    if (showOnion && m_timeline.onionForward() && showOnion == true) {
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

void EngineManager::terminateAnima(int returnCode) { QCoreApplication::exit(returnCode); }

void EngineManager::newProject() {
    m_timeline.clearAll();
    m_fileio.setPath("");
    m_fileio.markClean();
    emit frameUpdated(compositeFrame());
}

bool EngineManager::saveProject(const QString& path) {
    AnimaProject proj;
    proj.fps = 12;
    for(int i = 0; i < m_timeline.frameCount(); ++i) { proj.frames.append(m_timeline.imageAt(i)); }
    if (!proj.frames.isEmpty()) {
        proj.width = proj.frames.first().width();
        proj.height = proj.frames.first().height();
    }
    return m_fileio.saveAs(proj, path);
}

bool EngineManager::openProject(const QString& path) {
    AnimaProject proj = m_fileio.open(path);
    if (proj.frames.isEmpty()) return false;
    m_timeline.clearAll();
    m_timeline.deleteFrame(0);
    for (const QImage& img : proj.frames) {
        m_timeline.addFrame();
        m_timeline.currentImage() = img;
        m_timeline.next();
    }
    m_timeline.goTo(0);
    m_timeline.setFps(proj.fps);
    m_fileio.setPath(path);
    m_fileio.markClean();
    emit projectLoaded();
    return true;
}