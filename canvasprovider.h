#ifndef CANVASPROVIDER_H
#define CANVASPROVIDER_H

#include <QQuickPaintedItem>
#include <QImage>
#include <QPainter>

class CanvasProvider : public QQuickPaintedItem {
    Q_OBJECT
public:
    explicit CanvasProvider(QQuickItem* parent = nullptr);
    void paint(QPainter* painter) override;
    Q_INVOKABLE void updateImage(const QImage& img);

private:
    QImage m_image;
};

#endif // CANVASPROVIDER_H
