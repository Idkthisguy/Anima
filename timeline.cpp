#include "timeline.h"
#include <algorithm>

Timeline::Timeline(QObject* parent) : QObject(parent) {
    addFrame();
}

Timeline::~Timeline() = default;

void Timeline::setFps(int v)          { if (m_fps != v)          { m_fps = std::clamp(v,1,120); emit fpsChanged(); } }
void Timeline::setLooping(bool v)     { if (m_looping != v)      { m_looping = v;      emit loopingChanged(); } }
void Timeline::setOnionBack(bool v)   { if (m_onionBack != v)    { m_onionBack = v;    emit onionBackChanged(); } }
void Timeline::setOnionForward(bool v){ if (m_onionForward != v) { m_onionForward = v; emit onionForwardChanged(); } }
void Timeline::setOnionAlpha(float v) { if (m_onionAlpha != v)   { m_onionAlpha = std::clamp(v,.02f,.8f); emit onionAlphaChanged(); } }

QImage& Timeline::currentImage() {
    return m_frames[m_current]->image;
}

QImage Timeline::imageAt(int i) const {
    if (i < 0 || i >= (int)m_frames.size()) return {};
    return m_frames[i]->image;
}

bool Timeline::hasFrame(int i) const {
    return i >= 0 && i < (int)m_frames.size();
}

void Timeline::addFrame() {
    m_frames.push_back(std::make_unique<Anima::Frame>(CANVAS_W, CANVAS_H));
    emit frameCountChanged();
    goTo((int)m_frames.size() - 1);
}

void Timeline::duplicateFrame(int index) {
    if (!hasFrame(index)) return;
    auto f = std::make_unique<Anima::Frame>(*m_frames[index]);
    m_frames.insert(m_frames.begin() + index + 1, std::move(f));
    emit frameCountChanged();
    goTo(index + 1);
}

void Timeline::deleteFrame(int index) {
    if (m_frames.size() <= 1 || !hasFrame(index)) return;
    m_frames.erase(m_frames.begin() + index);
    emit frameCountChanged();
    goTo(std::clamp(m_current, 0, (int)m_frames.size() - 1));
}

void Timeline::goTo(int index) {
    index = std::clamp(index, 0, (int)m_frames.size() - 1);
    if (m_current != index) {
        m_current = index;
        emit currentFrameChanged();
    }
    emit imageChanged();
}

void Timeline::next() {
    if (m_current < (int)m_frames.size() - 1) goTo(m_current + 1);
}

void Timeline::prev() {
    if (m_current > 0) goTo(m_current - 1);
}

void Timeline::togglePlay() {
    m_playing = !m_playing;
    m_playTimer = 0;
    emit playingChanged();
}

void Timeline::stop() {
    if (m_playing) { m_playing = false; emit playingChanged(); }
}

void Timeline::tick(float dt) {
    if (!m_playing) return;
    m_playTimer += dt;
    float dur = 1.f / (float)m_fps;
    if (m_playTimer >= dur) {
        m_playTimer -= dur;
        int next = m_current + 1;
        if (next >= (int)m_frames.size()) {
            if (m_looping) next = 0;
            else { stop(); return; }
        }
        goTo(next);
    }
}

void Timeline::pushUndo() {
    if ((int)m_undoStack.size() >= MAX_UNDO)
        m_undoStack.erase(m_undoStack.begin());
    m_undoStack.push_back({ m_current, m_frames[m_current]->image.copy() });
    m_redoStack.clear();
}

void Timeline::undo() {
    if (m_undoStack.empty()) return;
    auto& e = m_undoStack.back();
    m_redoStack.push_back({ m_current, m_frames[m_current]->image.copy() });
    m_current = e.index;
    m_frames[m_current]->image = e.before;
    m_undoStack.pop_back();
    emit currentFrameChanged();
    emit imageChanged();
}

void Timeline::redo() {
    if (m_redoStack.empty()) return;
    auto& e = m_redoStack.back();
    m_undoStack.push_back({ m_current, m_frames[m_current]->image.copy() });
    m_current = e.index;
    m_frames[m_current]->image = e.before;
    m_redoStack.pop_back();
    emit currentFrameChanged();
    emit imageChanged();
}

void Timeline::clearFrame() {
    pushUndo();
    m_frames[m_current]->image.fill(Qt::transparent);
    emit imageChanged();
}

void Timeline::clearAll() {
    m_frames.clear();
    m_undoStack.clear();
    m_redoStack.clear();
    m_current = 0;
    addFrame();
    emit currentFrameChanged();
    emit frameCountChanged();
    emit imageChanged();
}

void Timeline::toggleOnionSkin() {
    setOnionBack(!m_onionBack);
    setOnionForward(!m_onionForward);
    emit imageChanged();
}