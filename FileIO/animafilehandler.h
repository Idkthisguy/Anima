#ifndef ANIMAFILEHANDLER_H
#define ANIMAFILEHANDLER_H

#include <QObject>

#include <QString>
#include "iomanager.h"

class AnimaFileHandler
{
public:
    AnimaFileHandler();

    static bool save(const QString& path, const AnimaProject& proj);
    static AnimaProject load(const QString& path);
};

#endif // ANIMAFILEHANDLER_H
