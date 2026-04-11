#ifndef IOMANAGER_H
#define IOMANAGER_H

#include <QObject>
#include <QString>
#include "Timeline/timelinemanager.h"

struct AnimaProject {
    int fps = 12;
    int width = 1280;
    int height = 720;
    QVector<QImage> frames;
};

class IOManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString currentPath READ currentPath NOTIFY currentPathChanged)
    Q_PROPERTY(bool isDirty READ isDirty NOTIFY isDirtyChanged)
    Q_PROPERTY(QStringList recentFiles READ recentFiles NOTIFY recentFilesChanged)

public:
    explicit IOManager(QObject* parent = nullptr);

    QString currentPath() const { return m_path; }
    bool isDirty() const { return m_dirty; }

    QStringList recentFiles() const { return m_recentFiles; }

    Q_INVOKABLE bool saveProject(timelineManager* timeline);
    Q_INVOKABLE bool saveProjectAs(const QString& path, timelineManager* timeline);
    Q_INVOKABLE bool openProject(const QString& path, timelineManager* timeline);

    Q_INVOKABLE bool exportToMP4(const QString& path, timelineManager* timeline);

    void markDirty() { if(!m_dirty) { m_dirty = true; emit isDirtyChanged(); } }
    void markClean() { if(m_dirty) { m_dirty = false; emit isDirtyChanged(); } }

    void addToRecents(const QString& path);

signals:
    void currentPathChanged();
    void isDirtyChanged();
    void errorOccurred(QString msg);
    void recentFilesChanged();

private:
    QString m_path;
    bool m_dirty = false;
    QStringList m_recentFiles;
};

#endif