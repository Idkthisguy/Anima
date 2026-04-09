#include "anxhandler.h"
#include <QFile>
#include <QDataStream>
#include <QBuffer>

static constexpr quint32 MAGIC = 0x414E5802;

bool AnxHandler::save(const QString& path, const AnimaProject& proj) {
    QFile f(path);
    if (!f.open(QIODevice::WriteOnly)) return false;

    QDataStream ds(&f);
    ds << MAGIC << (quint16)0x0200;
    ds << proj.fps << proj.width << proj.height;

    ds << (int)proj.frames.size();
    for(const auto& img : proj.frames) {
        ds << imageToBytes(img);
    }
    return true;
}

AnimaProject AnxHandler::load(const QString& path) {
    AnimaProject proj;
    QFile f(path);
    if (!f.open(QIODevice::ReadOnly)) return proj;

    QDataStream ds(&f);
    quint32 magic;
    ds >> magic;
    if (magic != MAGIC) return proj;

    quint16 ver; ds >> ver;
    ds >> proj.fps >> proj.width >> proj.height;

    int count; ds >> count;
    for(int i=0; i<count; ++i) {
        QByteArray data;
        ds >> data;
        proj.frames.append(bytesToImage(data));
    }
    return proj;
}

QByteArray AnxHandler::imageToBytes(const QImage& img) {
    QByteArray buf;
    QBuffer b(&buf);
    b.open(QIODevice::WriteOnly);
    img.save(&b, "PNG", 2);
    return qCompress(buf, 6);
}

QImage AnxHandler::bytesToImage(const QByteArray& data) {
    return QImage::fromData(qUncompress(data), "PNG");
}