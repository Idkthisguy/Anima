#ifndef TOOLHANDLER_H
#define TOOLHANDLER_H

#include <QObject>
#include <QColor>
#include <QString>

class ToolHandler : public QObject {
    Q_OBJECT
    Q_PROPERTY(int tool READ tool WRITE setTool NOTIFY toolChanged)
    Q_PROPERTY(int brushSize READ brushSize WRITE setBrushSize NOTIFY brushSizeChanged)
    Q_PROPERTY(float opacity READ opacity WRITE setOpacity NOTIFY opacityChanged)
    Q_PROPERTY(QString color READ color WRITE setColor NOTIFY colorChanged)
    Q_PROPERTY(float smoothing READ smoothing WRITE setSmoothing NOTIFY smoothingChanged)

public:
    enum ToolType { Brush = 0, Eraser = 1, Bucket = 2, Eyedropper = 3 };
    Q_ENUM(ToolType)

    explicit ToolHandler(QObject* parent = nullptr);

    int tool() const { return m_tool; }
    int brushSize() const { return m_brushSize; }
    float opacity() const { return m_opacity; }
    float smoothing() const { return m_smoothing; }

    QString color() const { return m_color.name(); }
    QColor rawColor() const { return m_color; } // For C++ to use directly

    void setTool(int v);
    void setBrushSize(int v);
    void setOpacity(float v);
    void setColor(const QString& hex);
    void setSmoothing(float v);

signals:
    void toolChanged();
    void brushSizeChanged();
    void opacityChanged();
    void colorChanged();
    void smoothingChanged();

private:
    int m_tool = Brush;
    int m_brushSize = 10;
    float m_opacity = 1.0f;
    float m_smoothing = 0.5f;
    QColor m_color = Qt::black;
};

#endif // TOOLHANDLER_H