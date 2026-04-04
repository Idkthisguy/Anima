#pragma once
#include <QObject>
#include <QImage>
#include <vector>
#include <memory>
#include "Frames.h"
#include <QFile>
#include <QDataStream>

class Timeline : public QObject {
    Q_OBJECT
    Q_PROPERTY(int  currentFrame  READ currentFrame  NOTIFY currentFrameChanged)
    Q_PROPERTY(int  frameCount    READ frameCount    NOTIFY frameCountChanged)
    Q_PROPERTY(int  fps           READ fps           WRITE setFps           NOTIFY fpsChanged)
    Q_PROPERTY(bool playing       READ playing       NOTIFY playingChanged)
    Q_PROPERTY(bool looping       READ looping       WRITE setLooping       NOTIFY loopingChanged)
    Q_PROPERTY(bool onionBack     READ onionBack     WRITE setOnionBack     NOTIFY onionBackChanged)
    Q_PROPERTY(bool onionForward  READ onionForward  WRITE setOnionForward  NOTIFY onionForwardChanged)
    Q_PROPERTY(float onionAlpha   READ onionAlpha    WRITE setOnionAlpha    NOTIFY onionAlphaChanged)

public:
    explicit Timeline(QObject* parent = nullptr);
    ~Timeline();

    int   currentFrame() const { return m_current; }
    int   frameCount()   const { return (int)m_frames.size(); }
    int   fps()          const { return m_fps; }
    bool  playing()      const { return m_playing; }
    bool  looping()      const { return m_looping; }
    bool  onionBack()    const { return m_onionBack; }
    bool  onionForward() const { return m_onionForward; }
    float onionAlpha()   const { return m_onionAlpha; }

    void setFps(int v);
    void setLooping(bool v);
    void setOnionBack(bool v);
    void setOnionForward(bool v);
    void setOnionAlpha(float v);
    void clearAll();
    void saveProject(const QString &filePath);
    void loadProject(const QString &filePath);

    QImage& currentImage();
    QImage  imageAt(int index) const;
    bool    hasFrame(int index) const;

    void tick(float dt);

public slots:
    void addFrame();
    void duplicateFrame(int index);
    void deleteFrame(int index);
    void goTo(int index);
    void next();
    void prev();
    void togglePlay();
    void stop();
    void pushUndo();
    void undo();
    void redo();
    void clearFrame();
    void toggleOnionSkin();

signals:
    void currentFrameChanged();
    void frameCountChanged();
    void fpsChanged();
    void playingChanged();
    void loopingChanged();
    void onionBackChanged();
    void onionForwardChanged();
    void onionAlphaChanged();
    void imageChanged();

private:
    static constexpr int CANVAS_W = 1280;
    static constexpr int CANVAS_H = 720;
    static constexpr int MAX_UNDO = 40;

    int   m_current    = 0;
    int   m_fps        = 12;
    bool  m_playing    = false;
    bool  m_looping    = true;
    bool  m_onionBack  = true;
    bool  m_onionForward = false;
    float m_onionAlpha = 0.3f;
    float m_playTimer  = 0.f;

    std::vector<std::unique_ptr<Anima::Frame>> m_frames;

    struct UndoEntry { int index; QImage before; };
    std::vector<UndoEntry> m_undoStack;
    std::vector<UndoEntry> m_redoStack;
};