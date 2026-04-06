#ifndef ENGINE_H
#define ENGINE_H

#include <QObject>
#include <QImage>
#include <QTimer>
#include <QPainter>
#include "timeline.h"
#include "fileio.h"

class Engine : public QObject {
    Q_OBJECT
    Q_PROPERTY(int   tool       READ tool       WRITE setTool       NOTIFY toolChanged)
    Q_PROPERTY(int   brushSize  READ brushSize  WRITE setBrushSize  NOTIFY brushSizeChanged)
    Q_PROPERTY(float opacity    READ opacity    WRITE setOpacity    NOTIFY opacityChanged)
    Q_PROPERTY(QString color    READ color      WRITE setColor      NOTIFY colorChanged)
    Q_PROPERTY(Timeline* timeline READ timeline CONSTANT)
    Q_PROPERTY(float smoothing READ smoothing WRITE setSmoothing NOTIFY smoothingChanged)
    Q_PROPERTY(FileIO* fileio   READ fileio     CONSTANT)


public:
    enum Tool { Brush = 0, Eraser = 1, Bucket = 2, Eyedropper = 3 };
    Q_ENUM(Tool)

    explicit Engine(QObject* parent = nullptr);

    int     tool()      const { return m_tool; }
    int     brushSize() const { return m_brushSize; }
    float   opacity()   const { return m_opacity; }
    float smoothing() const { return m_smoothing; }
    QString color()     const { return m_color.name(); }
    Timeline* timeline()     { return &m_timeline; }
    FileIO* fileio()          { return &m_fileio; }

    void setTool(int v);
    void setBrushSize(int v);
    void setOpacity(float v);
    void setColor(const QString& hex);
    void setSmoothing(float v);
    Q_INVOKABLE void terminateAnima(int returnCode = 0);
    Q_INVOKABLE void newProject();

    Q_INVOKABLE bool saveProject(const QString& path);
    Q_INVOKABLE bool openProject(const QString& path);

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
    void smoothingChanged();
    void projectLoaded();

private:
    int     m_tool      = 0;
    int     m_brushSize = 10;
    float   m_opacity   = 1.0f;
    QColor  m_color     = Qt::black;
    bool    m_inStroke  = false;
    qreal   m_lastX = -1, m_lastY = -1;

    Timeline m_timeline;
    FileIO   m_fileio;
    QTimer   m_tickTimer;

    void drawCircle(QImage& img, qreal x, qreal y);
    void floodFill(QImage& img, int x, int y, const QColor& fill);
    QImage compositeFrame() const;

    float m_smoothing = 0.5f;
    QPointF m_smoothPos;
};

#endif