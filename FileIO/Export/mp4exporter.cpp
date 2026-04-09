#include "mp4exporter.h"
#include <QProcess>
#include <QTemporaryDir>
#include <QPainter>
#include <QDebug>

bool Mp4Exporter::exportHD(const QString& outputPath, timelineManager* timeline) {
    if (!timeline || timeline->frameCount() == 0) return false;

    QTemporaryDir tempDir;
    if (!tempDir.isValid()) return false;

    for (int i = 0; i < timeline->frameCount(); ++i) {
        QString framePath = tempDir.path() + QString("/frame_%1.png").arg(i, 4, 10, QChar('0'));

        QImage rawFrame = timeline->imageAt(i);

        QImage hdFrame = rawFrame.scaled(1920, 1080, Qt::KeepAspectRatio, Qt::SmoothTransformation);

        QImage solidFrame(hdFrame.size(), QImage::Format_RGB32);
        solidFrame.fill(Qt::white);

        QPainter p(&solidFrame);
        p.drawImage(0, 0, hdFrame);
        p.end();

        solidFrame.save(framePath, "PNG", 100);
    }

    QProcess ffmpeg;
    QStringList args;
    args << "-y"
         << "-framerate" << QString::number(timeline->fps())
         << "-i" << tempDir.path() + "/frame_%04d.png"
         << "-c:v" << "libx264"
         << "-pix_fmt" << "yuv420p"
         << outputPath;

    ffmpeg.start("ffmpeg", args);
    ffmpeg.waitForFinished(-1);

    return (ffmpeg.exitCode() == 0);
}