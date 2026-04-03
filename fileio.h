#pragma once
#include <QObject>
#include <QImage>
#include <QString>
#include <QVector>

struct AnimaProject {
    int fps     = 12;
    int width   = 1280;
    int height  = 720;
    QVector<QImage> frames;
};

class FileIO : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString currentPath READ currentPath NOTIFY currentPathChanged)
    Q_PROPERTY(bool    isDirty     READ isDirty     NOTIFY isDirtyChanged)

public:
    explicit FileIO(QObject* parent = nullptr);

    QString currentPath() const { return m_path; }
    bool    isDirty()     const { return m_dirty; }

    Q_INVOKABLE bool saveAnx  (const QString& path, const AnimaProject& proj);
    Q_INVOKABLE bool saveAnima(const QString& path, const AnimaProject& proj);
    Q_INVOKABLE bool saveClassicAnima(const QString& path, const AnimaProject& proj);

    Q_INVOKABLE AnimaProject loadAnx  (const QString& path);
    Q_INVOKABLE AnimaProject loadAnima(const QString& path);

    Q_INVOKABLE bool save    (const AnimaProject& proj);
    Q_INVOKABLE bool saveAs  (const AnimaProject& proj, const QString& path);
    Q_INVOKABLE AnimaProject open(const QString& path);

    void markDirty()  { if(!m_dirty){ m_dirty=true;  emit isDirtyChanged(); } }
    void markClean()  { if(m_dirty) { m_dirty=false; emit isDirtyChanged(); } }
    void setPath(const QString& p);

signals:
    void currentPathChanged();
    void isDirtyChanged();
    void errorOccurred(const QString& msg);

private:
    QString m_path;
    bool    m_dirty = false;

    static QByteArray imageToBytes(const QImage& img);
    static QImage     bytesToImage(const QByteArray& data);
};