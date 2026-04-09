#include "animafilehandler.h"
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QBuffer>

bool AnimaFileHandler::save(const QString& path, const AnimaProject& proj) {
    QJsonObject root;
    root["version"] = "1.0";
    root["fps"] = proj.fps;

    QJsonArray frames;
    for(const auto& img : proj.frames) {
        QByteArray ba;
        QBuffer buf(&ba);
        buf.open(QIODevice::WriteOnly);
        img.save(&buf, "PNG");
        frames.append(QString::fromLatin1("data:image/png;base64," + ba.toBase64()));
    }
    root["frames"] = frames;

    QFile f(path);
    if(!f.open(QIODevice::WriteOnly)) return false;
    f.write(QJsonDocument(root).toJson(QJsonDocument::Compact));
    return true;
}

AnimaProject AnimaFileHandler::load(const QString& path) {
    AnimaProject proj;
    QFile f(path);
    if(!f.open(QIODevice::ReadOnly)) return proj;

    auto doc = QJsonDocument::fromJson(f.readAll());
    auto root = doc.object();

    proj.fps = root["fps"].toInt(12);
    for(auto v : root["frames"].toArray()) {
        QString s = v.toString();
        QByteArray raw = QByteArray::fromBase64(s.section(',', 1).toLatin1());
        proj.frames.append(QImage::fromData(raw, "PNG"));
    }
    return proj;
}