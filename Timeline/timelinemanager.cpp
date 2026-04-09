#include "timelinemanager.h"
#include <algorithm>

timelineManager::timelineManager(QObject* parent) : QObject(parent) {
    addFrame();
}

timelineManager::~timelineManager() = default;

void timelineManager::setFps(int v)          { if (m_fps != v)          { m_fps = std::clamp(v,1,120); emit fpsChanged(); } }
void timelineManager::setLooping(bool v)     { if (m_looping != v)      { m_looping = v;      emit loopingChanged(); } }
void timelineManager::setOnionBack(bool v)   { if (m_onionBack != v)    { m_onionBack = v;    emit onionBackChanged(); } }
void timelineManager::setOnionForward(bool v){ if (m_onionForward != v) { m_onionForward = v; emit onionForwardChanged(); } }
void timelineManager::setOnionAlpha(float v) { if (m_onionAlpha != v)   { m_onionAlpha = std::clamp(v,.02f,.8f); emit onionAlphaChanged(); } }

QImage& timelineManager::currentImage() {
    return m_frames[m_current]->image;
}

QImage timelineManager::imageAt(int i) const {
    if (i < 0 || i >= (int)m_frames.size()) return {};
    return m_frames[i]->image;
}

bool timelineManager::hasFrame(int i) const {
    return i >= 0 && i < (int)m_frames.size();
}

void timelineManager::addFrame() {
    m_frames.push_back(std::make_unique<Anima::Frame>(CANVAS_W, CANVAS_H));
    emit frameCountChanged();
    goTo((int)m_frames.size() - 1);
}

void timelineManager::duplicateFrame(int index) {
    if (!hasFrame(index)) return;
    auto f = std::make_unique<Anima::Frame>(*m_frames[index]);
    m_frames.insert(m_frames.begin() + index + 1, std::move(f));
    emit frameCountChanged();
    goTo(index + 1);
}

void timelineManager::deleteFrame(int index) {
    if (m_frames.size() <= 1 || !hasFrame(index)) return;
    m_frames.erase(m_frames.begin() + index);
    emit frameCountChanged();
    goTo(std::clamp(m_current, 0, (int)m_frames.size() - 1));
}

void timelineManager::goTo(int index) {
    index = std::clamp(index, 0, (int)m_frames.size() - 1);
    if (m_current != index) {
        m_current = index;
        emit currentFrameChanged();
    }
    emit imageChanged();
}

void timelineManager::next() {
    if (m_current < (int)m_frames.size() - 1) goTo(m_current + 1);
}

void timelineManager::prev() {
    if (m_current > 0) goTo(m_current - 1);
}

void timelineManager::togglePlay() {
    m_playing = !m_playing;
    m_playTimer = 0;
    emit playingChanged();
}

void timelineManager::stop() {
    if (m_playing) { m_playing = false; emit playingChanged(); }
}

void timelineManager::tick(float dt) {
    if (!m_playing) return;
    m_playTimer += dt;
    float dur = 1.f / (float)m_fps;
    if (m_playTimer >= dur) {
        m_playTimer -= dur;
        int next_frame = m_current + 1;
        if (next_frame >= (int)m_frames.size()) {
            if (m_looping) next_frame = 0;
            else { stop(); return; }
        }
        goTo(next_frame);
    }
}

void timelineManager::pushUndo() {
    if ((int)m_undoStack.size() >= MAX_UNDO)
        m_undoStack.erase(m_undoStack.begin());
    m_undoStack.push_back({ m_current, m_frames[m_current]->image.copy() });
    m_redoStack.clear();
}

void timelineManager::undo() {
    if (m_undoStack.empty()) return;
    auto& e = m_undoStack.back();
    m_redoStack.push_back({ m_current, m_frames[m_current]->image.copy() });
    m_current = e.index;
    m_frames[m_current]->image = e.before;
    m_undoStack.pop_back();
    emit currentFrameChanged();
    emit imageChanged();
}

void timelineManager::redo() {
    if (m_redoStack.empty()) return;
    auto& e = m_redoStack.back();
    m_undoStack.push_back({ m_current, m_frames[m_current]->image.copy() });
    m_current = e.index;
    m_frames[m_current]->image = e.before;
    m_redoStack.pop_back();
    emit currentFrameChanged();
    emit imageChanged();
}

void timelineManager::clearFrame() {
    pushUndo();
    m_frames[m_current]->image.fill(Qt::transparent);
    emit imageChanged();
}

void timelineManager::clearAll() {
    m_frames.clear();
    m_undoStack.clear();
    m_redoStack.clear();
    m_current = 0;
    addFrame();
    emit currentFrameChanged();
    emit frameCountChanged();
    emit imageChanged();
}

void timelineManager::toggleOnionSkin() {
    setOnionBack(!m_onionBack);
    setOnionForward(!m_onionForward);
    emit imageChanged();
}

void timelineManager::saveProject(const QString &filePath) {
    QFile file(filePath);
    if (!file.open(QIODevice::WriteOnly)) return;

    QDataStream out(&file);
    out << (quint32)0x414E4D41;
    out << (int)1;
    out << m_fps << m_looping << m_onionBack << m_onionForward << m_onionAlpha;
    out << (int)m_frames.size();
    for (const auto& frame : m_frames) {
        out << frame->image;
    }
    file.close();
}

void timelineManager::loadProject(const QString &filePath) {
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly)) return;

    QDataStream in(&file);
    quint32 magic;
    in >> magic;
    if (magic != 0x414E4D41) return;

    int version;
    in >> version;
    int newFps; bool newLoop;
    in >> newFps >> newLoop >> m_onionBack >> m_onionForward >> m_onionAlpha;
    setFps(newFps);
    setLooping(newLoop);

    m_frames.clear();
    m_undoStack.clear();
    m_redoStack.clear();

    int count;
    in >> count;
    for (int i = 0; i < count; ++i) {
        QImage loadedImg;
        in >> loadedImg;
        auto frame = std::make_unique<Anima::Frame>(CANVAS_W, CANVAS_H);
        frame->image = loadedImg;
        m_frames.push_back(std::move(frame));
    }
    file.close();

    m_current = 0;
    emit frameCountChanged();
    emit currentFrameChanged();
    emit imageChanged();
}