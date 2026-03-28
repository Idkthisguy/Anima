#include "canvasprovider.h"

CanvasProvider::CanvasProvider(QQuickItem* parent) : QQuickPaintedItem(parent) {
    m_image = QImage(1280, 720, QImage::Format_ARGB32_Premultiplied);
    m_image.fill(Qt::white);
}

void CanvasProvider::paint(QPainter* p) {
    p->setRenderHint(QPainter::SmoothPixmapTransform);
    p->drawImage(boundingRect(), m_image);
}

void CanvasProvider::updateImage(const QImage& img) {
    m_image = img;
    update();
}