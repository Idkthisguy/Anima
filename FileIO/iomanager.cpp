#include "iomanager.h"
#include "anxhandler.h"
#include "animafilehandler.h"
#include "Export/mp4exporter.h"

IOManager::IOManager(QObject* parent) : QObject(parent) {}

bool IOManager::saveProject(timelineManager* timeline) {
    if (m_path.isEmpty()) {
        return false;
    }
    return saveProjectAs(m_path, timeline);
}

AnimaProject packProject(timelineManager* timeline) {
    AnimaProject p;
    p.fps = timeline->fps();
    for(int i=0; i < timeline->frameCount(); ++i) {
        p.frames.append(timeline->imageAt(i));
    }
    return p;
}

bool IOManager::saveProjectAs(const QString& path, timelineManager* timeline) {
    AnimaProject proj = packProject(timeline);
    bool success = false;

    if (path.endsWith(".anx")) {
        success = AnxHandler::save(path, proj);
    } else {
        success = AnimaFileHandler::save(path, proj);
    }

    if (success) {
        m_path = path;
        emit currentPathChanged();
        markClean();
    }
    return success;
}

void IOManager::openProject(const QString& path, timelineManager* timeline) {
    AnimaProject proj;

    if (path.endsWith(".anx")) {
        proj = AnxHandler::load(path);
    } else {
        proj = AnimaFileHandler::load(path);
    }

    timeline->clearAll();
    timeline->setFps(proj.fps);

    for(const auto& img : proj.frames) {
        timeline->addFrame();
        timeline->currentImage() = img;
        timeline->next();
    }

    timeline->goTo(0);

    m_path = path;
    emit currentPathChanged();
    markClean();
}

bool IOManager::exportToMP4(const QString& path, timelineManager* timeline) {
    return Mp4Exporter::exportHD(path, timeline);
}