#ifndef ANXHANDLER_H
#define ANXHANDLER_H

#include <QString>
#include "iomanager.h"

class AnxHandler {
public:
    static bool save(const QString& path, const AnimaProject& proj);
    static AnimaProject load(const QString& path);

private:
    static QByteArray imageToBytes(const QImage& img);
    static QImage bytesToImage(const QByteArray& data);
};

#endif