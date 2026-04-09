#ifndef MP4EXPORTER_H
#define MP4EXPORTER_H

#include <QString>
#include "Timeline/timelinemanager.h"

class Mp4Exporter {
public:
    static bool exportHD(const QString& outputPath, timelineManager* timeline);
};

#endif