#ifndef ENGINEMANAGER_H
#define ENGINEMANAGER_H

#include <QObject>
#include <QImage>
#include <QTimer>
#include <QPainter>
#include "toolHandler.h"
#include "../timeline.h" // Keep your original path for now
#include "../fileio.h"   // Keep your original path for now

class EngineManager : public QObject {
    Q_OBJECT

    // We expose the ToolHandler directly to QML!
    Q_PROPERTY(ToolHandler* tools READ tools CONSTANT)
    Q_PROPERTY(Timeline* timeline READ timeline CONSTANT)
    Q_PROPERTY(FileIO* fileio READ fileio CONSTANT)

public:
    explicit EngineManager(QObject* parent = nullptr);

    ToolHandler* tools() { return &m_tools; }
    Timeline* timeline() { return &m_timeline; }
    FileIO* fileio() { return &m_fileio; }

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
    void frameUpdated(const QImage& img);
    void colorPicked(const QString& hex);
    void projectLoaded();

private:
    ToolHandler m_tools;
    Timeline m_timeline;
    FileIO m_fileio;
    QTimer m_tickTimer;

    bool m_inStroke = false;
    qreal m_lastX = -1, m_lastY = -1;
    QPointF m_smoothPos;

    QImage compositeFrame() const;
};

#endif // ENGINEMANAGER_H