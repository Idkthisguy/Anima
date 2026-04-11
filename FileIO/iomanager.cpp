#include <QDebug>
#include <QSettings>
#include "iomanager.h"
#include "anxhandler.h"
#include "animafilehandler.h"
#include "Export/mp4exporter.h"
#include "Timeline/timelinemanager.h"

IOManager::IOManager(QObject* parent) : QObject(parent) {
    QSettings settings("AnimaStudio", "Anima");
    m_recentFiles = settings.value("recentFiles").toStringList();
}

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

void IOManager::addToRecents(const QString& path) {
    qDebug() << "Architect: Registering project path to history:" << path;

    m_recentFiles.removeAll(path);

    m_recentFiles.prepend(path);

    while (m_recentFiles.size() > 6) {
        m_recentFiles.removeLast();
    }

    QSettings settings("AnimaStudio", "Anima");
    settings.setValue("recentFiles", m_recentFiles);

    emit recentFilesChanged();
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
        addToRecents(path);
        emit currentPathChanged();
        markClean();
    }
    return success;
}


bool IOManager::openProject(const QString& path, timelineManager* timeline) {
    AnimaProject proj;

    if (path.endsWith(".anx")) {
        proj = AnxHandler::load(path);
    } else {
        proj = AnimaFileHandler::load(path);
    }

    if (proj.frames.isEmpty()) return false;

    timeline->clearAll();
    timeline->addFrame();

    timeline->setFps(proj.fps);

    for (int i = 0; i < proj.frames.size(); ++i) {
        timeline->addFrame();
        timeline->goTo(timeline->frameCount() - 1);
        timeline->currentImage() = proj.frames[i];
    }

    timeline->deleteFrame(0);

    timeline->goTo(0);
    m_path = path;
    addToRecents(path);
    emit currentPathChanged();

    return true;
}

bool IOManager::exportToMP4(const QString& path, timelineManager* timeline) {
    return Mp4Exporter::exportHD(path, timeline);
}