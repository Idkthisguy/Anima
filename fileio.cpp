#include "fileio.h"
#include <QFile>
#include <QDataStream>
#include <QBuffer>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QByteArray>
#include <QFileInfo>
#include <QDir>

static constexpr quint32 ANX_MAGIC   = 0x414E5802;
static constexpr quint16 ANX_VERSION = 0x0200;

FileIO::FileIO(QObject* parent) : QObject(parent) {}

void FileIO::setPath(const QString& p) {
    if (m_path != p) { m_path = p; emit currentPathChanged(); }
}

QByteArray FileIO::imageToBytes(const QImage& img) {
    QByteArray buf;
    QBuffer b(&buf);
    b.open(QIODevice::WriteOnly);
    img.save(&b, "PNG", 2);
    return qCompress(buf, 6);
}

QImage FileIO::bytesToImage(const QByteArray& data) {
    QByteArray raw = qUncompress(data);
    QImage img;
    img.loadFromData(raw, "PNG");
    return img;
}

bool FileIO::saveAnx(const QString& path, const AnimaProject& proj) {
    QFile f(path);
    if (!f.open(QIODevice::WriteOnly)) { emit errorOccurred("Cannot write: " + path); return false; }

    QDataStream ds(&f);
    ds.setVersion(QDataStream::Qt_6_0);
    ds.setByteOrder(QDataStream::BigEndian);

    ds << ANX_MAGIC << ANX_VERSION;
    ds << (qint32)proj.fps << (qint32)proj.width << (qint32)proj.height;
    ds << (qint32)proj.frames.size();
    for (const QImage& img : proj.frames)
        ds << imageToBytes(img);

    return f.error() == QFile::NoError;
}

AnimaProject FileIO::loadAnx(const QString& path) {
    AnimaProject proj;
    QFile f(path);
    if (!f.open(QIODevice::ReadOnly)) { emit errorOccurred("Cannot open: " + path); return proj; }

    QDataStream ds(&f);
    ds.setVersion(QDataStream::Qt_6_0);
    ds.setByteOrder(QDataStream::BigEndian);

    quint32 magic; quint16 ver;
    ds >> magic >> ver;
    if (magic != ANX_MAGIC) { emit errorOccurred("Not a valid .anx file"); return proj; }

    qint32 fps, w, h, count;
    ds >> fps >> w >> h >> count;
    proj.fps = fps; proj.width = w; proj.height = h;

    for (int i = 0; i < count; i++) {
        QByteArray data; ds >> data;
        proj.frames.append(bytesToImage(data));
    }

    return proj;
}

bool FileIO::saveAnima(const QString& path, const AnimaProject& proj) {
    QJsonObject root;
    root["version"] = "2.0";
    root["fps"]     = proj.fps;
    root["width"]   = proj.width;
    root["height"]  = proj.height;

    QJsonArray frames;
    for (const QImage& img : proj.frames) {
        QByteArray raw;
        QBuffer buf(&raw);
        buf.open(QIODevice::WriteOnly);
        img.save(&buf, "PNG", 4);
        frames.append("data:image/png;base64," + QString::fromLatin1(raw.toBase64()));
    }
    root["frames"] = frames;

    QFile f(path);
    if (!f.open(QIODevice::WriteOnly)) { emit errorOccurred("Cannot write: " + path); return false; }
    f.write(QJsonDocument(root).toJson(QJsonDocument::Compact));
    return true;
}

bool FileIO::saveClassicAnima(const QString& path, const AnimaProject& proj) {
    QFile f(path);
    if (!f.open(QIODevice::WriteOnly)) return false;

    QJsonObject root;
    root["appName"] = "Anima";
    root["version"] = "2.0";
    root["fps"] = QString::number(proj.fps);
    root["maxFrames"] = proj.frames.size();

    QJsonArray framesArray;
    for (const QImage& img : proj.frames) {
        QByteArray ba;
        QBuffer buffer(&ba);
        buffer.open(QIODevice::WriteOnly);
        img.save(&buffer, "PNG");

        QString base64 = ba.toBase64();

        framesArray.append("data:image/png;base64," + base64);
    }
    root["frames"] = framesArray;

    QJsonDocument doc(root);
    f.write(doc.toJson());
    return true;
}

AnimaProject FileIO::loadAnima(const QString& path) {
    AnimaProject proj;
    QFile f(path);
    if (!f.open(QIODevice::ReadOnly)) { emit errorOccurred("Cannot open: " + path); return proj; }

    auto doc = QJsonDocument::fromJson(f.readAll());
    if (doc.isNull()) { emit errorOccurred("Invalid .anima JSON"); return proj; }

    auto root   = doc.object();
    proj.fps    = root["fps"].toInt(12);
    proj.width  = root["width"].toInt(1280);
    proj.height = root["height"].toInt(720);

    for (auto v : root["frames"].toArray()) {
        QString s = v.toString();
        int comma = s.indexOf(',');
        QByteArray raw = QByteArray::fromBase64(s.mid(comma+1).toLatin1());
        QImage img;
        img.loadFromData(raw, "PNG");
        if (!img.isNull()) proj.frames.append(img);
    }

    return proj;
}

bool FileIO::save(const AnimaProject& proj) {
    if (m_path.isEmpty()) return false;
    bool ok = m_path.endsWith(".anx", Qt::CaseInsensitive)
                  ? saveAnx(m_path, proj)
                  : saveAnima(m_path, proj);
    if (ok) markClean();
    return ok;
}

bool FileIO::saveAs(const AnimaProject& proj, const QString& path) {
    bool ok = false;

    if (path.endsWith(".anx", Qt::CaseInsensitive)) {
        ok = saveAnx(path, proj);
    } else {
        ok = saveAnima(path, proj);
    }

    if (ok) {
        setPath(path);
        markClean();
    }
    return ok;
}

AnimaProject FileIO::open(const QString& path) {
    if (path.endsWith(".anx", Qt::CaseInsensitive)) {
        return loadAnx(path);
    } else {
        return loadAnima(path);
    }
}
