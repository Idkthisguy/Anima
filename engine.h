#ifndef ENGINE_H
#define ENGINE_H

#include <QObject>
#include <QImage>
#include <QTimer>
#include <QPainter>
#include "timeline.h"

class Engine : public QObject {
    Q_OBJECT
    Q_PROPERTY(int   tool       READ tool       WRITE setTool       NOTIFY toolChanged)
    Q_PROPERTY(int   brushSize  READ brushSize  WRITE setBrushSize  NOTIFY brushSizeChanged)
    Q_PROPERTY(float opacity    READ opacity    WRITE setOpacity    NOTIFY opacityChanged)
    Q_PROPERTY(QString color    READ color      WRITE setColor      NOTIFY colorChanged)
    Q_PROPERTY(Timeline* timeline READ timeline CONSTANT)

public:
    enum Tool { Brush = 0, Eraser = 1, Bucket = 2, Eyedropper = 3 };
    Q_ENUM(Tool)

    explicit Engine(QObject* parent = nullptr);

    int     tool()      const { return m_tool; }
    int     brushSize() const { return m_brushSize; }
    float   opacity()   const { return m_opacity; }
    QString color()     const { return m_color.name(); }
    Timeline* timeline()     { return &m_timeline; }

    void setTool(int v);
    void setBrushSize(int v);
    void setOpacity(float v);
    void setColor(const QString& hex);

public slots:
    void paintAt(qreal x, qreal y);
    void beginStroke(qreal x, qreal y);
    void endStroke();
    void pickColor(qreal x, qreal y);

signals:
    void toolChanged();
    void brushSizeChanged();
    void opacityChanged();
    void colorChanged();
    void frameUpdated(const QImage& img);
    void colorPicked(const QString& hex);

private:
    int     m_tool      = 0;
    int     m_brushSize = 10;
    float   m_opacity   = 1.0f;
    QColor  m_color     = Qt::black;
    bool    m_inStroke  = false;
    qreal   m_lastX = -1, m_lastY = -1;

    Timeline m_timeline;
    QTimer   m_tickTimer;

    void drawCircle(QImage& img, qreal x, qreal y);
    void floodFill(QImage& img, int x, int y, const QColor& fill);
    QImage compositeFrame() const;
};

#endif